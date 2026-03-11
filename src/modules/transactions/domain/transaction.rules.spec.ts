import { AppException } from '../../../common/errors/app.exception';
import { TransactionRules } from './transaction.rules';
import {
  TransactionEffectOperation,
  TransactionEffectRole,
  TransactionStatus,
  TransactionType,
} from './transaction.types';

describe('TransactionRules', () => {
  describe('normalizeReference', () => {
    it('normalizes spaces and uppercases the reference', () => {
      expect(TransactionRules.normalizeReference(' dep 001 abc ')).toBe(
        'DEP-001-ABC',
      );
    });
  });

  describe('validateAccounts', () => {
    it('throws for transfer without destination account', () => {
      expect(() =>
        TransactionRules.validateAccounts(
          TransactionType.TRANSFER,
          'source-id',
          null,
        ),
      ).toThrow(AppException);
    });

    it('throws when transfer source and destination are the same', () => {
      expect(() =>
        TransactionRules.validateAccounts(
          TransactionType.TRANSFER,
          'same-id',
          'same-id',
        ),
      ).toThrow(AppException);
    });

    it('allows deposit without destination account', () => {
      expect(() =>
        TransactionRules.validateAccounts(TransactionType.DEPOSIT, 'source-id'),
      ).not.toThrow();
    });
  });

  describe('ensureValidStatusTransition', () => {
    it('allows completed to reversed transition', () => {
      expect(() =>
        TransactionRules.ensureValidStatusTransition(
          TransactionStatus.COMPLETED,
          TransactionStatus.REVERSED,
        ),
      ).not.toThrow();
    });

    it('rejects pending to reversed transition', () => {
      expect(() =>
        TransactionRules.ensureValidStatusTransition(
          TransactionStatus.PENDING,
          TransactionStatus.REVERSED,
        ),
      ).toThrow(AppException);
    });
  });

  describe('executeMovement', () => {
    it('returns credit effect for deposit', () => {
      const effects = TransactionRules.executeMovement({
        type: TransactionType.DEPOSIT,
        amount: 150,
        destinationAccountId: null,
      });

      expect(effects).toEqual([
        {
          role: TransactionEffectRole.SOURCE,
          operation: TransactionEffectOperation.CREDIT,
          amount: 150,
        },
      ]);
    });

    it('returns source debit and destination credit for transfer', () => {
      const effects = TransactionRules.executeMovement({
        type: TransactionType.TRANSFER,
        amount: 200,
        destinationAccountId: 'dest-id',
      });

      expect(effects).toEqual([
        {
          role: TransactionEffectRole.SOURCE,
          operation: TransactionEffectOperation.DEBIT,
          amount: 200,
        },
        {
          role: TransactionEffectRole.DESTINATION,
          operation: TransactionEffectOperation.CREDIT,
          amount: 200,
        },
      ]);
    });
  });

  describe('reverseExecutedMovement', () => {
    it('returns destination debit and source credit for transfer reversal', () => {
      const effects = TransactionRules.reverseExecutedMovement({
        type: TransactionType.TRANSFER,
        amount: 200,
        destinationAccountId: 'dest-id',
      });

      expect(effects).toEqual([
        {
          role: TransactionEffectRole.DESTINATION,
          operation: TransactionEffectOperation.DEBIT,
          amount: 200,
        },
        {
          role: TransactionEffectRole.SOURCE,
          operation: TransactionEffectOperation.CREDIT,
          amount: 200,
        },
      ]);
    });
  });
});
