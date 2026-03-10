import { Currency } from '../../../../common/domain/currency.enum';
import { ExchangeRateEntity } from '../../domain/exchange-rate.entity';

export const EXCHANGE_RATE_REPOSITORY = Symbol('EXCHANGE_RATE_REPOSITORY');

export interface FindDuplicateExchangeRateParams {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  effectiveAt: Date;
  excludeId?: string;
}

export interface ExchangeRateRepository {
  create(data: Partial<ExchangeRateEntity>): ExchangeRateEntity;
  save(rate: ExchangeRateEntity): Promise<ExchangeRateEntity>;
  findAll(): Promise<ExchangeRateEntity[]>;
  findById(id: string): Promise<ExchangeRateEntity | null>;
  findDuplicate(
    params: FindDuplicateExchangeRateParams,
  ): Promise<ExchangeRateEntity | null>;
  findLatest(
    baseCurrency: Currency,
    quoteCurrency: Currency,
    effectiveAt?: Date,
  ): Promise<ExchangeRateEntity | null>;
  remove(rate: ExchangeRateEntity): Promise<void>;
}
