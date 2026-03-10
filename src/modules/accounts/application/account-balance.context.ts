import { AccountRules } from '../domain/account.rules';

export interface AccountBalanceContext {
  accountId: string;
  debit(amount: number): void;
  credit(amount: number): void;
  currentBalance(): number;
  snapshot(): AccountBalanceSnapshot;
}

export interface AccountBalanceSnapshot {
  accountId: string;
  previousBalance: number;
  currentBalance: number;
}

export function createAccountBalanceContext(account: {
  id: string;
  balance: number;
}): AccountBalanceContext {
  const state = {
    balance: account.balance,
  };
  const initialBalance = account.balance;

  return {
    accountId: account.id,
    debit(amount: number) {
      AccountRules.applyDebit(state, amount);
    },
    credit(amount: number) {
      AccountRules.applyCredit(state, amount);
    },
    currentBalance() {
      return state.balance;
    },
    snapshot() {
      return {
        accountId: account.id,
        previousBalance: initialBalance,
        currentBalance: state.balance,
      };
    },
  };
}
