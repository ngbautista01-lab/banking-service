import { Currency } from '../../../../common/domain/currency.enum';
import { ExchangeContext } from '../exchange.context';

export const EXCHANGE_CONTEXT_PORT = Symbol('EXCHANGE_CONTEXT_PORT');

export interface ExchangeContextPort {
  createContext(params: {
    baseCurrency: Currency;
    quoteCurrency: Currency;
    effectiveAt?: Date;
  }): ExchangeContext;
}
