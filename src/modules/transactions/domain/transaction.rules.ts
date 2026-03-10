import { AppException } from '../../../common/errors/app.exception';
import { TransactionEntity } from './transaction.entity';
import {
  TransactionBalanceEffect,
  TransactionEffectOperation,
  TransactionEffectRole,
  TransactionStatus,
  TransactionType,
} from './transaction.types';

export class TransactionRules {
  static ensureIsUnique(
    existingTransaction: Pick<TransactionEntity, 'id'> | null,
  ): void {
    if (existingTransaction) {
      throw new AppException('TRANSACTION_ALREADY_EXISTS');
    }
  }

  static normalizeReference(reference: string): string {
    return reference.trim().replace(/\s+/g, '-').toUpperCase();
  }

  static validateReference(reference: string): void {
    const normalized = this.normalizeReference(reference);

    if (!/^[A-Z0-9-]+$/.test(normalized) || normalized.length < 4) {
      throw new AppException('INVALID_TRANSACTION_REFERENCE');
    }
  }

  static validateAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppException('INVALID_TRANSACTION_AMOUNT');
    }
  }

  static validateAccounts(
    type: TransactionType,
    sourceAccountId: string,
    destinationAccountId?: string | null,
  ): void {
    if (!sourceAccountId) {
      throw new AppException('INVALID_TRANSACTION_ACCOUNTS');
    }

    if (type === TransactionType.TRANSFER) {
      if (!destinationAccountId || destinationAccountId === sourceAccountId) {
        throw new AppException('INVALID_TRANSACTION_ACCOUNTS');
      }
    }
  }

  static ensureMutableFinancialFields(
    current: TransactionEntity,
    next: Pick<
      TransactionEntity,
      'sourceAccountId' | 'destinationAccountId' | 'type' | 'amount'
    >,
  ): void {
    const changed =
      current.sourceAccountId !== next.sourceAccountId ||
      current.destinationAccountId !== next.destinationAccountId ||
      current.type !== next.type ||
      current.amount !== next.amount;

    if (changed && current.status === TransactionStatus.COMPLETED) {
      throw new AppException('INVALID_TRANSACTION_STATE');
    }
  }

  static ensureValidStatusTransition(
    currentStatus: TransactionStatus,
    nextStatus: TransactionStatus,
  ): void {
    if (
      currentStatus !== TransactionStatus.COMPLETED &&
      currentStatus !== TransactionStatus.REVERSED &&
      nextStatus === TransactionStatus.REVERSED
    ) {
      throw new AppException('INVALID_TRANSACTION_STATE');
    }

    if (
      currentStatus === TransactionStatus.REVERSED &&
      nextStatus !== TransactionStatus.REVERSED
    ) {
      throw new AppException('INVALID_TRANSACTION_STATE');
    }

    if (
      currentStatus === TransactionStatus.COMPLETED &&
      nextStatus !== TransactionStatus.COMPLETED &&
      nextStatus !== TransactionStatus.REVERSED
    ) {
      throw new AppException('INVALID_TRANSACTION_STATE');
    }
  }

  static shouldApplyMovement(
    currentStatus: TransactionStatus,
    nextStatus: TransactionStatus,
  ): boolean {
    return (
      currentStatus !== TransactionStatus.COMPLETED &&
      nextStatus === TransactionStatus.COMPLETED
    );
  }

  static shouldReverseMovement(
    currentStatus: TransactionStatus,
    nextStatus: TransactionStatus,
  ): boolean {
    return (
      currentStatus === TransactionStatus.COMPLETED &&
      nextStatus === TransactionStatus.REVERSED
    );
  }

  static executeMovement(
    transaction: Pick<
      TransactionEntity,
      'type' | 'amount' | 'destinationAccountId'
    >,
  ): TransactionBalanceEffect[] {
    return this.executionEffects(transaction);
  }

  static reverseExecutedMovement(
    transaction: Pick<
      TransactionEntity,
      'type' | 'amount' | 'destinationAccountId'
    >,
  ): TransactionBalanceEffect[] {
    return this.reversalEffects(transaction);
  }

  private static executionEffects(
    transaction: Pick<
      TransactionEntity,
      'type' | 'amount' | 'destinationAccountId'
    >,
  ): TransactionBalanceEffect[] {
    switch (transaction.type) {
      case TransactionType.DEPOSIT:
        return [
          {
            role: TransactionEffectRole.SOURCE,
            operation: TransactionEffectOperation.CREDIT,
            amount: transaction.amount,
          },
        ];
      case TransactionType.WITHDRAWAL:
        return [
          {
            role: TransactionEffectRole.SOURCE,
            operation: TransactionEffectOperation.DEBIT,
            amount: transaction.amount,
          },
        ];
      case TransactionType.TRANSFER:
        if (!transaction.destinationAccountId) {
          throw new AppException('INVALID_TRANSACTION_ACCOUNTS');
        }
        return [
          {
            role: TransactionEffectRole.SOURCE,
            operation: TransactionEffectOperation.DEBIT,
            amount: transaction.amount,
          },
          {
            role: TransactionEffectRole.DESTINATION,
            operation: TransactionEffectOperation.CREDIT,
            amount: transaction.amount,
          },
        ];
      default:
        throw new AppException('INVALID_TRANSACTION_STATE');
    }
  }

  private static reversalEffects(
    transaction: Pick<
      TransactionEntity,
      'type' | 'amount' | 'destinationAccountId'
    >,
  ): TransactionBalanceEffect[] {
    switch (transaction.type) {
      case TransactionType.DEPOSIT:
        return [
          {
            role: TransactionEffectRole.SOURCE,
            operation: TransactionEffectOperation.DEBIT,
            amount: transaction.amount,
          },
        ];
      case TransactionType.WITHDRAWAL:
        return [
          {
            role: TransactionEffectRole.SOURCE,
            operation: TransactionEffectOperation.CREDIT,
            amount: transaction.amount,
          },
        ];
      case TransactionType.TRANSFER:
        if (!transaction.destinationAccountId) {
          throw new AppException('INVALID_TRANSACTION_ACCOUNTS');
        }
        return [
          {
            role: TransactionEffectRole.DESTINATION,
            operation: TransactionEffectOperation.DEBIT,
            amount: transaction.amount,
          },
          {
            role: TransactionEffectRole.SOURCE,
            operation: TransactionEffectOperation.CREDIT,
            amount: transaction.amount,
          },
        ];
      default:
        throw new AppException('INVALID_TRANSACTION_STATE');
    }
  }
}
