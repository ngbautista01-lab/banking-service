import { AppException } from '../../../common/errors/app.exception';
import { AccountRules } from './account.rules';

describe('AccountRules', () => {
  describe('normalizeAccountNumber', () => {
    it('removes spaces and hyphens and uppercases the value', () => {
      expect(AccountRules.normalizeAccountNumber(' acc-001 23 ')).toBe(
        'ACC00123',
      );
    });
  });

  describe('validateAccountNumber', () => {
    it('accepts a valid account number', () => {
      expect(() => AccountRules.validateAccountNumber('ACC00123')).not.toThrow();
    });

    it('rejects an invalid account number', () => {
      expect(() => AccountRules.validateAccountNumber('acc-1')).toThrow(
        AppException,
      );
    });
  });

  describe('ensureSufficientFunds', () => {
    it('throws when balance is lower than amount', () => {
      expect(() =>
        AccountRules.ensureSufficientFunds({ balance: 50 }, 100),
      ).toThrow(AppException);
    });
  });

  describe('applyDebit', () => {
    it('subtracts amount from balance when funds are sufficient', () => {
      const account = { balance: 250 };

      AccountRules.applyDebit(account, 75);

      expect(account.balance).toBe(175);
    });
  });

  describe('applyCredit', () => {
    it('adds amount to balance', () => {
      const account = { balance: 250 };

      AccountRules.applyCredit(account, 75);

      expect(account.balance).toBe(325);
    });
  });

  describe('ensureIsUnique', () => {
    it('throws when the account already exists', () => {
      expect(() =>
        AccountRules.ensureIsUnique({} as never),
      ).toThrow(AppException);
    });

    it('does not throw when the account is unique', () => {
      expect(() => AccountRules.ensureIsUnique(null)).not.toThrow();
    });
  });
});
