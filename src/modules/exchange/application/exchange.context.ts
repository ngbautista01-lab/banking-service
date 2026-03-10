import { Currency } from '../../../common/domain/currency.enum';
import { CurrencyConversionOutput } from './exchange.dto';

export interface ExchangeContext {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  convert(amount: number): Promise<CurrencyConversionOutput>;
}
