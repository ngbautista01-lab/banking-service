import { AppException } from '../../../common/errors/app.exception';
import { AccountEntity } from './account.entity';

export class AccountRules {
  static ensureIsUnique(existingAccount: AccountEntity | null): void {
    if (existingAccount) {
      throw new AppException('ACCOUNT_ALREADY_EXISTS');
    }
  }

  static validateAccountNumber(accountNumber: string): void {
    const normalized = this.normalizeAccountNumber(accountNumber);

    if (!/^[A-Z0-9]+$/.test(normalized) || normalized.length < 8) {
      throw new AppException('INVALID_ACCOUNT_NUMBER');
    }
  }

  static normalizeAccountNumber(accountNumber: string): string {
    return accountNumber.trim().replace(/[\s-]+/g, '').toUpperCase();
  }

  static ensureSufficientFunds(
    account: Pick<AccountEntity, 'balance'>,
    amount: number,
  ): void {
    if (account.balance < amount) {
      throw new AppException('INSUFFICIENT_ACCOUNT_FUNDS');
    }
  }

  static applyDebit(account: Pick<AccountEntity, 'balance'>, amount: number): void {
    this.ensureSufficientFunds(account, amount);
    account.balance -= amount;
  }

  static applyCredit(account: Pick<AccountEntity, 'balance'>, amount: number): void {
    account.balance += amount;
  }
}
