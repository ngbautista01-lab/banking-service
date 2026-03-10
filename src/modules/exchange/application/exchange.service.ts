import { Inject, Injectable } from '@nestjs/common';
import { validate as isUuid, v4 as uuidv4 } from 'uuid';
import { Currency } from '../../../common/domain/currency.enum';
import { AppException } from '../../../common/errors/app.exception';
import { ExchangeContext } from './exchange.context';
import {
  ConvertCurrencyInput,
  CreateExchangeRateInput,
  CurrencyConversionOutput,
  UpdateExchangeRateInput,
} from './exchange.dto';
import { ExchangeContextPort } from './ports/exchange-context.port';
import { ExchangeRatePort } from './ports/exchange-rate.port';
import {
  EXCHANGE_RATE_REPOSITORY,
  ExchangeRateRepository,
} from './ports/exchange-rate.repository';
import { ExchangeRateEntity } from '../domain/exchange-rate.entity';
import { ExchangeRules } from '../domain/exchange.rules';

@Injectable()
export class ExchangeService implements ExchangeRatePort, ExchangeContextPort {
  constructor(
    @Inject(EXCHANGE_RATE_REPOSITORY)
    private readonly exchangeRateRepository: ExchangeRateRepository,
  ) {}

  async create(input: CreateExchangeRateInput): Promise<ExchangeRateEntity> {
    ExchangeRules.validateCurrencies(input.baseCurrency, input.quoteCurrency);
    ExchangeRules.validateRate(input.rate);

    const existingRate = await this.exchangeRateRepository.findDuplicate({
      baseCurrency: input.baseCurrency,
      quoteCurrency: input.quoteCurrency,
      effectiveAt: input.effectiveAt,
    });

    ExchangeRules.ensureIsUnique(existingRate);

    const rate = this.exchangeRateRepository.create({
      id: uuidv4(),
      baseCurrency: input.baseCurrency,
      quoteCurrency: input.quoteCurrency,
      rate: input.rate,
      effectiveAt: input.effectiveAt,
    });

    return this.exchangeRateRepository.save(rate);
  }

  findAll(): Promise<ExchangeRateEntity[]> {
    return this.exchangeRateRepository.findAll();
  }

  async findById(id: string): Promise<ExchangeRateEntity> {
    if (!id || !isUuid(id)) {
      throw new AppException('EXCHANGE_RATE_NOT_FOUND');
    }

    const rate = await this.exchangeRateRepository.findById(id);
    if (!rate) {
      throw new AppException('EXCHANGE_RATE_NOT_FOUND');
    }

    return rate;
  }

  async update(input: UpdateExchangeRateInput): Promise<ExchangeRateEntity> {
    const rate = await this.findById(input.id);

    const nextBaseCurrency = input.baseCurrency ?? rate.baseCurrency;
    const nextQuoteCurrency = input.quoteCurrency ?? rate.quoteCurrency;
    const nextRate = input.rate ?? rate.rate;
    const nextEffectiveAt = input.effectiveAt ?? rate.effectiveAt;

    ExchangeRules.validateCurrencies(nextBaseCurrency, nextQuoteCurrency);
    ExchangeRules.validateRate(nextRate);

    const existingRate = await this.exchangeRateRepository.findDuplicate({
      baseCurrency: nextBaseCurrency,
      quoteCurrency: nextQuoteCurrency,
      effectiveAt: nextEffectiveAt,
      excludeId: rate.id,
    });

    ExchangeRules.ensureIsUnique(existingRate);

    const mergedRate = this.exchangeRateRepository.create({
      ...rate,
      baseCurrency: nextBaseCurrency,
      quoteCurrency: nextQuoteCurrency,
      rate: nextRate,
      effectiveAt: nextEffectiveAt,
    });

    return this.exchangeRateRepository.save(mergedRate);
  }

  async remove(id: string): Promise<boolean> {
    const rate = await this.findById(id);
    await this.exchangeRateRepository.remove(rate);
    return true;
  }

  async convert({
    amount,
    baseCurrency,
    quoteCurrency,
    effectiveAt,
  }: {
    amount: number;
    baseCurrency: Currency;
    quoteCurrency: Currency;
    effectiveAt?: Date;
  }): Promise<CurrencyConversionOutput> {
    if (baseCurrency === quoteCurrency) {
      return {
        amount,
        baseCurrency,
        quoteCurrency,
        rate: 1,
        convertedAmount: amount,
        effectiveAt: effectiveAt ?? new Date(),
      };
    }

    const exchangeRate = await this.exchangeRateRepository.findLatest(
      baseCurrency,
      quoteCurrency,
      effectiveAt,
    );

    if (!exchangeRate) {
      throw new AppException('EXCHANGE_RATE_NOT_FOUND');
    }

    return {
      amount,
      baseCurrency,
      quoteCurrency,
      rate: exchangeRate.rate,
      convertedAmount: Number((amount * exchangeRate.rate).toFixed(2)),
      effectiveAt: exchangeRate.effectiveAt,
    };
  }

  async convertInput(
    input: ConvertCurrencyInput,
  ): Promise<CurrencyConversionOutput> {
    return this.convert(input);
  }

  createContext(params: {
    baseCurrency: Currency;
    quoteCurrency: Currency;
    effectiveAt?: Date;
  }): ExchangeContext {
    return {
      baseCurrency: params.baseCurrency,
      quoteCurrency: params.quoteCurrency,
      convert: (amount: number) =>
        this.convert({
          amount,
          baseCurrency: params.baseCurrency,
          quoteCurrency: params.quoteCurrency,
          effectiveAt: params.effectiveAt,
        }),
    };
  }

}
