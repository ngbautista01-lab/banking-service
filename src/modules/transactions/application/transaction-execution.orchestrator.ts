import { Injectable } from '@nestjs/common';
import { AppException } from '../../../common/errors/app.exception';
import {
  AccountBalanceContext,
  AccountBalanceSnapshot,
} from '../../accounts/application/account-balance.context';
import { ExchangeContext } from '../../exchange/application/exchange.context';
import { CurrencyConversionOutput } from '../../exchange/application/exchange.dto';
import { TransactionEntity } from '../domain/transaction.entity';
import { TransactionRules } from '../domain/transaction.rules';
import {
  TransactionBalanceEffect,
  TransactionEffectOperation,
  TransactionEffectRole,
  TransactionType,
} from '../domain/transaction.types';

interface ReversibleTransactionContext {
  type: TransactionType;
  amount: number;
  destinationAccountId: string | null;
  convertedAmount: number | null;
}

export interface TransactionExecutionResult {
  balanceSnapshots: AccountBalanceSnapshot[];
  exchangeDetails: CurrencyConversionOutput | null;
}

@Injectable()
export class TransactionExecutionOrchestrator {
  async execute(params: {
    transaction: Pick<
      TransactionEntity,
      'type' | 'amount' | 'destinationAccountId'
    >;
    sourceAccountContext: AccountBalanceContext;
    destinationAccountContext: AccountBalanceContext | null;
    exchangeContext: ExchangeContext | null;
  }): Promise<TransactionExecutionResult> {
    const effects = await this.resolveExecutionEffects(
      params.transaction,
      params.exchangeContext,
    );

    this.applyEffects(
      effects.balanceEffects,
      params.transaction,
      params.sourceAccountContext,
      params.destinationAccountContext,
    );

    return {
      balanceSnapshots: this.captureSnapshots(
        params.sourceAccountContext,
        params.destinationAccountContext,
      ),
      exchangeDetails: effects.exchangeDetails,
    };
  }

  async reverse(params: {
    transaction: ReversibleTransactionContext;
    sourceAccountContext: AccountBalanceContext;
    destinationAccountContext: AccountBalanceContext | null;
  }): Promise<TransactionExecutionResult> {
    const effects = this.resolveReversalEffects(params.transaction);

    this.applyEffects(
      effects.balanceEffects,
      params.transaction,
      params.sourceAccountContext,
      params.destinationAccountContext,
    );

    return {
      balanceSnapshots: this.captureSnapshots(
        params.sourceAccountContext,
        params.destinationAccountContext,
      ),
      exchangeDetails: null,
    };
  }

  captureSnapshots(
    sourceAccountContext: AccountBalanceContext,
    destinationAccountContext: AccountBalanceContext | null,
  ): AccountBalanceSnapshot[] {
    return destinationAccountContext
      ? [sourceAccountContext.snapshot(), destinationAccountContext.snapshot()]
      : [sourceAccountContext.snapshot()];
  }

  private async resolveExecutionEffects(
    transaction: Pick<
      TransactionEntity,
      'type' | 'amount' | 'destinationAccountId'
    >,
    exchangeContext: ExchangeContext | null,
  ): Promise<{
    balanceEffects: TransactionBalanceEffect[];
    exchangeDetails: CurrencyConversionOutput | null;
  }> {
    const effects = TransactionRules.executeMovement(transaction);

    if (transaction.type !== TransactionType.TRANSFER || !exchangeContext) {
      return {
        balanceEffects: effects,
        exchangeDetails: null,
      };
    }

    if (exchangeContext.baseCurrency === exchangeContext.quoteCurrency) {
      return {
        balanceEffects: effects,
        exchangeDetails: null,
      };
    }

    const conversion = await exchangeContext.convert(transaction.amount);

    return {
      balanceEffects: effects.map((effect) =>
        effect.role === TransactionEffectRole.DESTINATION &&
        effect.operation === TransactionEffectOperation.CREDIT
          ? {
              ...effect,
              amount: conversion.convertedAmount,
            }
          : effect,
      ),
      exchangeDetails: conversion,
    };
  }

  private resolveReversalEffects(
    transaction: ReversibleTransactionContext,
  ): {
    balanceEffects: TransactionBalanceEffect[];
  } {
    const effects = TransactionRules.reverseExecutedMovement(transaction);

    if (
      transaction.type !== TransactionType.TRANSFER ||
      transaction.convertedAmount === null ||
      transaction.convertedAmount === undefined
    ) {
      return {
        balanceEffects: effects,
      };
    }

    return {
      balanceEffects: effects.map((effect) =>
        effect.role === TransactionEffectRole.DESTINATION &&
        effect.operation === TransactionEffectOperation.DEBIT
          ? {
              ...effect,
              amount: transaction.convertedAmount ?? effect.amount,
            }
          : effect,
      ),
    };
  }

  private applyEffects(
    effects: TransactionBalanceEffect[],
    transaction: Pick<TransactionEntity, 'destinationAccountId'>,
    sourceAccountContext: AccountBalanceContext,
    destinationAccountContext: AccountBalanceContext | null,
  ): void {
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
}
