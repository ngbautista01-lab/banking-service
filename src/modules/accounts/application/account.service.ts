import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { AppException } from '../../../common/errors/app.exception';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { SearchService } from '../../../infrastructure/search/search.service';
import {
  CreateAccountInput,
  SearchAccountsInput,
  UpdateAccountInput,
} from './account.dto';
import {
  ACCOUNT_REPOSITORY,
  AccountRepository,
} from './ports/account.repository';
import { AccountEntity } from '../domain/account.entity';
import { AccountRules } from '../domain/account.rules';

@Injectable()
export class AccountService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    private readonly cacheService: CacheService,
    private readonly searchService: SearchService,
  ) {}

  async create(input: CreateAccountInput): Promise<AccountEntity> {
    const normalizedAccountNumber = AccountRules.normalizeAccountNumber(
      input.accountNumber,
    );

    const existingAccount = await this.accountRepository.findDuplicate({
      accountNumber: normalizedAccountNumber,
    });

    AccountRules.ensureIsUnique(existingAccount);
    AccountRules.validateAccountNumber(normalizedAccountNumber);

    const account = this.accountRepository.create({
      id: uuidv4(),
      clientId: input.clientId,
      accountNumber: normalizedAccountNumber,
      alias: input.alias,
      currency: input.currency,
      balance: input.balance,
      status: input.status,
    });

    const savedAccount = await this.accountRepository.save(account);
    await Promise.all([
      this.cacheAccount(savedAccount),
      this.searchService.indexAccount(savedAccount),
    ]);
    return savedAccount;
  }

  async findAll(): Promise<AccountEntity[]> {
    const cacheKey = this.collectionCacheKey();
    const cachedAccounts = await this.cacheService.get<AccountEntity[]>(cacheKey);
    if (cachedAccounts) {
      return cachedAccounts;
    }

    const accounts = await this.accountRepository.findAll();

    await this.cacheService.set(cacheKey, accounts, 60);
    return accounts;
  }

  async findById(id: string): Promise<AccountEntity> {
    if (!id || !isUuid(id)) {
      throw new AppException('ACCOUNT_NOT_FOUND');
    }

    const cacheKey = this.accountCacheKey(id);
    const cachedAccount = await this.cacheService.get<AccountEntity>(cacheKey);
    if (cachedAccount) {
      return cachedAccount;
    }

    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new AppException('ACCOUNT_NOT_FOUND');
    }

    await this.cacheAccount(account);
    return account;
  }

  async search(input: SearchAccountsInput): Promise<AccountEntity[]> {
    const ids = await this.searchService.searchAccounts(input.term);
    if (ids.length > 0) {
      return this.accountRepository.findByIds(ids);
    }

    return this.accountRepository.searchByTerm(input.term);
  }

  async update(input: UpdateAccountInput): Promise<AccountEntity> {
    const account = await this.getAccountOrThrow(input.id);

    const nextAccountNumber =
      input.accountNumber !== undefined
        ? AccountRules.normalizeAccountNumber(input.accountNumber)
        : account.accountNumber;

    const existingAccount = await this.accountRepository.findDuplicate({
      accountNumber: nextAccountNumber,
      excludeId: account.id,
    });

    AccountRules.ensureIsUnique(existingAccount);
    AccountRules.validateAccountNumber(nextAccountNumber);

    const mergedAccount = this.accountRepository.create({
      ...account,
      clientId: input.clientId ?? account.clientId,
      accountNumber: nextAccountNumber,
      alias: input.alias ?? account.alias,
      currency: input.currency ?? account.currency,
      balance: input.balance ?? account.balance,
      status: input.status ?? account.status,
    });

    const savedAccount = await this.accountRepository.save(mergedAccount);
    await Promise.all([
      this.cacheAccount(savedAccount),
      this.searchService.indexAccount(savedAccount),
    ]);

    return savedAccount;
  }

  async remove(id: string): Promise<boolean> {
    const account = await this.getAccountOrThrow(id);
    await this.accountRepository.remove(account);
    await Promise.all([
      this.cacheService.del(this.accountCacheKey(id)),
      this.cacheService.del(this.collectionCacheKey()),
      this.searchService.removeAccount(id),
    ]);
    return true;
  }

  private async cacheAccount(account: AccountEntity): Promise<void> {
    await Promise.all([
      this.cacheService.set(this.accountCacheKey(account.id), account, 120),
      this.cacheService.del(this.collectionCacheKey()),
    ]);
  }

  private accountCacheKey(id: string): string {
    return `account:v2:${id}`;
  }

  private collectionCacheKey(): string {
    return 'accounts:v2:all';
  }

  private async getAccountOrThrow(id: string): Promise<AccountEntity> {
    if (!id || !isUuid(id)) {
      throw new AppException('ACCOUNT_NOT_FOUND');
    }

    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new AppException('ACCOUNT_NOT_FOUND');
    }

    return account;
  }
}
