import { Injectable } from '@nestjs/common';
import { AppException } from '../../../common/errors/app.exception';
import {
  AccountBalanceContext,
  AccountBalanceSnapshot,
} from '../../accounts/application/account-balance.context';
import { TransactionEntity } from '../domain/transaction.entity';
import {
  TransactionBalanceEffect,
  TransactionEffectOperation,
  TransactionEffectRole,
} from '../domain/transaction.types';

@Injectable()
export class TransactionBalanceOrchestrator {
  applyEffects(
    effects: TransactionBalanceEffect[],
    transaction: Pick<TransactionEntity, 'destinationAccountId'>,
    sourceAccountContext: AccountBalanceContext,
    destinationAccountContext: AccountBalanceContext | null,
  ): AccountBalanceSnapshot[] {
    const contexts = this.compactContexts(
      sourceAccountContext,
      destinationAccountContext,
    );

    for (const effect of effects) {
      const context = this.resolveContext(
        effect,
        transaction,
        sourceAccountContext,
        destinationAccountContext,
      );

      if (effect.operation === TransactionEffectOperation.DEBIT) {
        context.debit(effect.amount);
      } else {
        context.credit(effect.amount);
      }
    }

    return contexts.map((context) => context.snapshot());
  }

  captureSnapshots(
    sourceAccountContext: AccountBalanceContext,
    destinationAccountContext: AccountBalanceContext | null,
  ): AccountBalanceSnapshot[] {
    return this.compactContexts(
      sourceAccountContext,
      destinationAccountContext,
    ).map((context) => context.snapshot());
  }

  private resolveContext(
    effect: TransactionBalanceEffect,
    transaction: Pick<TransactionEntity, 'destinationAccountId'>,
    sourceAccountContext: AccountBalanceContext,
    destinationAccountContext: AccountBalanceContext | null,
  ): AccountBalanceContext {
    if (effect.role === TransactionEffectRole.SOURCE) {
      return sourceAccountContext;
    }

    if (!transaction.destinationAccountId || !destinationAccountContext) {
      throw new AppException('INVALID_TRANSACTION_ACCOUNTS');
    }

    return destinationAccountContext;
  }

  private compactContexts(
    sourceAccountContext: AccountBalanceContext,
    destinationAccountContext: AccountBalanceContext | null,
  ): AccountBalanceContext[] {
    return destinationAccountContext
      ? [sourceAccountContext, destinationAccountContext]
      : [sourceAccountContext];
  }
}
