import { AppException } from '../../../common/errors/app.exception';
import { Currency } from '../../../common/domain/currency.enum';
import { ExchangeRules } from './exchange.rules';

describe('ExchangeRules', () => {
  describe('validateRate', () => {
    it('accepts a positive rate', () => {
      expect(() => ExchangeRules.validateRate(55.5)).not.toThrow();
    });

    it('rejects zero or negative rates', () => {
      expect(() => ExchangeRules.validateRate(0)).toThrow(AppException);
      expect(() => ExchangeRules.validateRate(-1)).toThrow(AppException);
    });
  });

  describe('validateCurrencies', () => {
    it('rejects same currency pairs', () => {
      expect(() =>
        ExchangeRules.validateCurrencies(Currency.DOP, Currency.DOP),
      ).toThrow(AppException);
    });

    it('accepts different currency pairs', () => {
      expect(() =>
        ExchangeRules.validateCurrencies(Currency.DOP, Currency.USD),
      ).not.toThrow();
    });
  });

  describe('ensureIsUnique', () => {
    it('throws when an existing rate is found', () => {
      expect(() => ExchangeRules.ensureIsUnique({ id: 'rate-id' })).toThrow(
        AppException,
      );
    });

    it('does not throw when rate is unique', () => {
      expect(() => ExchangeRules.ensureIsUnique(null)).not.toThrow();
    });
  });
});
