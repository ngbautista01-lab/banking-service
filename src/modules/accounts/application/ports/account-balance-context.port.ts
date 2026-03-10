import {
  AccountBalanceContext,
  AccountBalanceSnapshot,
} from '../account-balance.context';

export const ACCOUNT_BALANCE_CONTEXT_PORT = Symbol(
  'ACCOUNT_BALANCE_CONTEXT_PORT',
);

export interface AccountBalanceContextPort {
  create(account: { id: string; balance: number }): AccountBalanceContext;
  snapshot(
    sourceContext: AccountBalanceContext,
    destinationContext?: AccountBalanceContext | null,
  ): AccountBalanceSnapshot[];
}
