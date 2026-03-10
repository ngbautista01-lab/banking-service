import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { validate as isUuid, v4 as uuidv4 } from 'uuid';
import { AppException } from '../../../common/errors/app.exception';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { SearchService } from '../../../infrastructure/search/search.service';
import {
  AccountBalanceContext,
  AccountBalanceSnapshot,
} from '../../accounts/application/account-balance.context';
import {
  ACCOUNT_BALANCE_CONTEXT_PORT,
  AccountBalanceContextPort,
} from '../../accounts/application/ports/account-balance-context.port';
import { AccountEntity } from '../../accounts/domain/account.entity';
import { TransactionBalanceOrchestrator } from './transaction-balance.orchestrator';
import {
  CreateTransactionInput,
  SearchTransactionsInput,
  UpdateTransactionInput,
} from './transaction.dto';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepository,
} from './ports/transaction.repository';
import { TransactionEntity } from '../domain/transaction.entity';
import { TransactionRules } from '../domain/transaction.rules';
import { TransactionStatus, TransactionType } from '../domain/transaction.types';

@Injectable()
export class TransactionService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepository,
    @Inject(ACCOUNT_BALANCE_CONTEXT_PORT)
    private readonly accountBalanceContextPort: AccountBalanceContextPort,
    private readonly transactionBalanceOrchestrator: TransactionBalanceOrchestrator,
    private readonly cacheService: CacheService,
    private readonly searchService: SearchService,
  ) {}

  async create(input: CreateTransactionInput): Promise<TransactionEntity> {
    const normalizedReference = TransactionRules.normalizeReference(
      input.reference,
    );

    const existingTransaction = await this.transactionRepository.findDuplicate({
      reference: normalizedReference,
    });

    TransactionRules.ensureIsUnique(existingTransaction);
    TransactionRules.validateReference(normalizedReference);
    TransactionRules.validateAmount(input.amount);
    TransactionRules.validateAccounts(
      input.type,
      input.sourceAccountId,
      input.destinationAccountId,
    );

    const savedTransaction = await this.dataSource.transaction(async (manager) => {
      const accountRepository = manager.getRepository(AccountEntity);
      const transactionTypeOrmRepository = manager.getRepository(TransactionEntity);

      const sourceAccount = await this.getAccountOrThrow(
        input.sourceAccountId,
        accountRepository,
      );
      const destinationAccount =
        input.type === TransactionType.TRANSFER && input.destinationAccountId
          ? await this.getAccountOrThrow(
              input.destinationAccountId,
              accountRepository,
            )
          : null;

      const transaction = transactionTypeOrmRepository.create({
        id: uuidv4(),
        sourceAccountId: sourceAccount.id,
        destinationAccountId:
          input.type === TransactionType.TRANSFER
            ? destinationAccount?.id ?? null
            : null,
        type: input.type,
        channel: input.channel,
        currency: input.currency,
        amount: input.amount,
        reference: normalizedReference,
        description: input.description ?? null,
        status: input.status,
        sourcePreviousBalance: sourceAccount.balance,
        sourceCurrentBalance: sourceAccount.balance,
        destinationPreviousBalance: destinationAccount?.balance ?? null,
        destinationCurrentBalance: destinationAccount?.balance ?? null,
      });

      if (transaction.status === TransactionStatus.COMPLETED) {
        const sourceAccountContext =
          this.accountBalanceContextPort.create(sourceAccount);
        const destinationAccountContext = destinationAccount
          ? this.accountBalanceContextPort.create(destinationAccount)
          : null;
        const balanceEffects = TransactionRules.executeMovement(transaction);
        const balanceSnapshots = this.transactionBalanceOrchestrator.applyEffects(
          balanceEffects,
          transaction,
          sourceAccountContext,
          destinationAccountContext,
        );
        this.syncAccountBalance(sourceAccount, sourceAccountContext);
        this.syncAccountBalance(destinationAccount, destinationAccountContext);
        this.assignBalanceSnapshots(transaction, balanceSnapshots);
        await accountRepository.save(
          destinationAccount
            ? [sourceAccount, destinationAccount]
            : [sourceAccount],
        );
      }

      return transactionTypeOrmRepository.save(transaction);
    });

    await this.syncTransactionState(savedTransaction);

    return savedTransaction;
  }

  async findAll(): Promise<TransactionEntity[]> {
    const cacheKey = this.collectionCacheKey();
    const cachedTransactions =
      await this.cacheService.get<TransactionEntity[]>(cacheKey);
    if (cachedTransactions) {
      return cachedTransactions;
    }

    const transactions = await this.transactionRepository.findAll();
    await this.cacheService.set(cacheKey, transactions, 60);
    return transactions;
  }

  async findById(id: string): Promise<TransactionEntity> {
    if (!id || !isUuid(id)) {
      throw new AppException('TRANSACTION_NOT_FOUND');
    }

    const cacheKey = this.transactionCacheKey(id);
    const cachedTransaction =
      await this.cacheService.get<TransactionEntity>(cacheKey);
    if (cachedTransaction) {
      return cachedTransaction;
    }

    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new AppException('TRANSACTION_NOT_FOUND');
    }

    await this.cacheTransaction(transaction);
    return transaction;
  }

  async search(input: SearchTransactionsInput): Promise<TransactionEntity[]> {
    const ids = await this.searchService.searchTransactions(input.term);
    if (ids.length > 0) {
      return this.transactionRepository.findByIds(ids);
    }

    return this.transactionRepository.searchByTerm(input.term);
  }

  async update(input: UpdateTransactionInput): Promise<TransactionEntity> {
    const transaction = await this.getTransactionOrThrow(input.id);

    const nextReference =
      input.reference !== undefined
        ? TransactionRules.normalizeReference(input.reference)
        : transaction.reference;

    const existingTransaction = await this.transactionRepository.findDuplicate({
      reference: nextReference,
      excludeId: transaction.id,
    });

    TransactionRules.ensureIsUnique(existingTransaction);
    TransactionRules.validateReference(nextReference);
    TransactionRules.validateAmount(input.amount ?? transaction.amount);
    TransactionRules.validateAccounts(
      input.type ?? transaction.type,
      input.sourceAccountId ?? transaction.sourceAccountId,
      input.destinationAccountId ?? transaction.destinationAccountId,
    );
    TransactionRules.ensureMutableFinancialFields(transaction, {
      sourceAccountId: input.sourceAccountId ?? transaction.sourceAccountId,
      destinationAccountId:
        (input.type ?? transaction.type) === TransactionType.TRANSFER
          ? input.destinationAccountId ?? transaction.destinationAccountId
          : null,
      type: input.type ?? transaction.type,
      amount: input.amount ?? transaction.amount,
    });

    const savedTransaction = await this.dataSource.transaction(async (manager) => {
      const accountRepository = manager.getRepository(AccountEntity);
      const transactionTypeOrmRepository = manager.getRepository(TransactionEntity);
      const persistedTransaction = await transactionTypeOrmRepository.findOne({
        where: { id: transaction.id },
      });

      if (!persistedTransaction) {
        throw new AppException('TRANSACTION_NOT_FOUND');
      }

      const nextTransaction = transactionTypeOrmRepository.create({
        ...persistedTransaction,
        sourceAccountId:
          input.sourceAccountId ?? persistedTransaction.sourceAccountId,
        destinationAccountId:
          (input.type ?? persistedTransaction.type) === TransactionType.TRANSFER
            ? input.destinationAccountId ??
              persistedTransaction.destinationAccountId
            : null,
        type: input.type ?? persistedTransaction.type,
        channel: input.channel ?? persistedTransaction.channel,
        currency: input.currency ?? persistedTransaction.currency,
        amount: input.amount ?? persistedTransaction.amount,
        reference: nextReference,
        description: input.description ?? persistedTransaction.description,
        status: input.status ?? persistedTransaction.status,
        sourcePreviousBalance: persistedTransaction.sourcePreviousBalance,
        sourceCurrentBalance: persistedTransaction.sourceCurrentBalance,
        destinationPreviousBalance:
          persistedTransaction.destinationPreviousBalance,
        destinationCurrentBalance: persistedTransaction.destinationCurrentBalance,
      });

      TransactionRules.ensureValidStatusTransition(
        persistedTransaction.status,
        nextTransaction.status,
      );

      const affectedAccounts: AccountEntity[] = [];

      if (
        TransactionRules.shouldApplyMovement(
          persistedTransaction.status,
          nextTransaction.status,
        )
      ) {
        const sourceAccount = await this.getAccountOrThrow(
          nextTransaction.sourceAccountId,
          accountRepository,
        );
        const destinationAccount =
          nextTransaction.type === TransactionType.TRANSFER &&
          nextTransaction.destinationAccountId
            ? await this.getAccountOrThrow(
                nextTransaction.destinationAccountId,
                accountRepository,
              )
            : null;
        const sourceAccountContext =
          this.accountBalanceContextPort.create(sourceAccount);
        const destinationAccountContext = destinationAccount
          ? this.accountBalanceContextPort.create(destinationAccount)
          : null;

        const balanceEffects = TransactionRules.executeMovement(nextTransaction);
        const balanceSnapshots = this.transactionBalanceOrchestrator.applyEffects(
          balanceEffects,
          nextTransaction,
          sourceAccountContext,
          destinationAccountContext,
        );
        this.syncAccountBalance(sourceAccount, sourceAccountContext);
        this.syncAccountBalance(destinationAccount, destinationAccountContext);
        this.assignBalanceSnapshots(nextTransaction, balanceSnapshots);
        affectedAccounts.push(...this.compactAccounts(sourceAccount, destinationAccount));
      }

      if (
        TransactionRules.shouldReverseMovement(
          persistedTransaction.status,
          nextTransaction.status,
        )
      ) {
        const sourceAccount = await this.getAccountOrThrow(
          persistedTransaction.sourceAccountId,
          accountRepository,
        );
        const destinationAccount =
          persistedTransaction.type === TransactionType.TRANSFER &&
          persistedTransaction.destinationAccountId
            ? await this.getAccountOrThrow(
                persistedTransaction.destinationAccountId,
                accountRepository,
              )
            : null;
        const sourceAccountContext =
          this.accountBalanceContextPort.create(sourceAccount);
        const destinationAccountContext = destinationAccount
          ? this.accountBalanceContextPort.create(destinationAccount)
          : null;

        const balanceEffects =
          TransactionRules.reverseExecutedMovement(persistedTransaction);
        const balanceSnapshots = this.transactionBalanceOrchestrator.applyEffects(
          balanceEffects,
          persistedTransaction,
          sourceAccountContext,
          destinationAccountContext,
        );
        this.syncAccountBalance(sourceAccount, sourceAccountContext);
        this.syncAccountBalance(destinationAccount, destinationAccountContext);
        this.assignBalanceSnapshots(nextTransaction, balanceSnapshots);
        affectedAccounts.push(...this.compactAccounts(sourceAccount, destinationAccount));
      }

      if (affectedAccounts.length === 0) {
        const sourceAccount = await this.getAccountOrThrow(
          nextTransaction.sourceAccountId,
          accountRepository,
        );
        const destinationAccount = nextTransaction.destinationAccountId
          ? await this.getAccountOrThrow(
              nextTransaction.destinationAccountId,
              accountRepository,
            )
          : null;
        const sourceAccountContext =
          this.accountBalanceContextPort.create(sourceAccount);
        const destinationAccountContext = destinationAccount
          ? this.accountBalanceContextPort.create(destinationAccount)
          : null;

        this.assignBalanceSnapshots(
          nextTransaction,
          this.accountBalanceContextPort.snapshot(
            sourceAccountContext,
            destinationAccountContext,
          ),
        );
      }

      if (affectedAccounts.length > 0) {
        await accountRepository.save(affectedAccounts);
      }

      return transactionTypeOrmRepository.save(nextTransaction);
    });

    await this.syncTransactionState(savedTransaction);

    return savedTransaction;
  }

  async remove(id: string): Promise<boolean> {
    const transaction = await this.getTransactionOrThrow(id);
    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new AppException('INVALID_TRANSACTION_STATE');
    }

    await this.transactionRepository.remove(transaction);
    await Promise.all([
      this.cacheService.del(this.transactionCacheKey(id)),
      this.cacheService.del(this.collectionCacheKey()),
      this.searchService.removeTransaction(id),
    ]);
    return true;
  }

  private async cacheTransaction(transaction: TransactionEntity): Promise<void> {
    await Promise.all([
      this.cacheService.set(
        this.transactionCacheKey(transaction.id),
        transaction,
        120,
      ),
      this.cacheService.del(this.collectionCacheKey()),
    ]);
  }

  private async syncTransactionState(
    transaction: TransactionEntity,
  ): Promise<void> {
    await Promise.all([
      this.cacheTransaction(transaction),
      this.searchService.indexTransaction(transaction),
      this.syncAffectedAccounts(transaction),
    ]);
  }

  private transactionCacheKey(id: string): string {
    return `transaction:${id}`;
  }

  private collectionCacheKey(): string {
    return 'transactions:all';
  }

  private async getTransactionOrThrow(id: string): Promise<TransactionEntity> {
    if (!id || !isUuid(id)) {
      throw new AppException('TRANSACTION_NOT_FOUND');
    }

    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new AppException('TRANSACTION_NOT_FOUND');
    }

    return transaction;
  }

  private async getAccountOrThrow(
    id: string,
    repository = this.dataSource.getRepository(AccountEntity),
  ): Promise<AccountEntity> {
    if (!id || !isUuid(id)) {
      throw new AppException('ACCOUNT_NOT_FOUND');
    }

    const account = await repository.findOne({ where: { id } });
    if (!account) {
      throw new AppException('ACCOUNT_NOT_FOUND');
    }

    return account;
  }

  private compactAccounts(
    sourceAccount: AccountEntity,
    destinationAccount: AccountEntity | null,
  ): AccountEntity[] {
    return destinationAccount
      ? [sourceAccount, destinationAccount]
      : [sourceAccount];
  }

  private syncAccountBalance(
    account: AccountEntity | null,
    context: AccountBalanceContext | null,
  ): void {
    if (!account || !context) {
      return;
    }

    account.balance = context.currentBalance();
  }

  private assignBalanceSnapshots(
    transaction: TransactionEntity,
    snapshots: AccountBalanceSnapshot[],
  ): void {
    const sourceSnapshot = snapshots.find(
      (snapshot) => snapshot.accountId === transaction.sourceAccountId,
    );
    const destinationSnapshot = transaction.destinationAccountId
      ? snapshots.find(
          (snapshot) => snapshot.accountId === transaction.destinationAccountId,
        )
      : undefined;

    if (sourceSnapshot) {
      transaction.sourcePreviousBalance = sourceSnapshot.previousBalance;
      transaction.sourceCurrentBalance = sourceSnapshot.currentBalance;
    }

    transaction.destinationPreviousBalance =
      destinationSnapshot?.previousBalance ?? null;
    transaction.destinationCurrentBalance =
      destinationSnapshot?.currentBalance ?? null;
  }

  private async syncAffectedAccounts(
    transaction: TransactionEntity,
  ): Promise<void> {
    const accountIds = [
      transaction.sourceAccountId,
      transaction.destinationAccountId,
    ].filter((value): value is string => Boolean(value));

    if (accountIds.length === 0) {
      return;
    }

    const accounts = await Promise.all(
      accountIds.map((accountId) => this.getAccountOrThrow(accountId)),
    );

    await Promise.all(
      accounts.flatMap((account) => [
        this.cacheService.set(`account:${account.id}`, account, 120),
        this.searchService.indexAccount(account),
      ]),
    );

    await this.cacheService.del('accounts:all');
  }
}
