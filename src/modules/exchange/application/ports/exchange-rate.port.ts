import { Currency } from '../../../../common/domain/currency.enum';
import { CurrencyConversionOutput } from '../exchange.dto';

export const EXCHANGE_RATE_PORT = Symbol('EXCHANGE_RATE_PORT');

export interface ExchangeRatePort {
  convert(params: {
    amount: number;
    baseCurrency: Currency;
    quoteCurrency: Currency;
    effectiveAt?: Date;
  }): Promise<CurrencyConversionOutput>;
}
