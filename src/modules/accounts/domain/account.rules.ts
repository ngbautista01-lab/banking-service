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
}
