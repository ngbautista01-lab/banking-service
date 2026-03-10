import { AppException } from '../../../common/errors/app.exception';
import { Currency } from '../../../common/domain/currency.enum';
import { ExchangeRateEntity } from './exchange-rate.entity';

export class ExchangeRules {
  static ensureIsUnique(
    existingRate: Pick<ExchangeRateEntity, 'id'> | null,
  ): void {
    if (existingRate) {
      throw new AppException('EXCHANGE_RATE_ALREADY_EXISTS');
    }
  }

  static validateRate(rate: number): void {
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new AppException('INVALID_EXCHANGE_RATE');
    }
  }

  static validateCurrencies(
    baseCurrency: Currency,
    quoteCurrency: Currency,
  ): void {
    if (baseCurrency === quoteCurrency) {
      throw new AppException('INVALID_EXCHANGE_CURRENCIES');
    }
  }
}
