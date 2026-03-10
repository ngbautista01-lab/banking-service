import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  ConvertCurrencyInput,
  CreateExchangeRateInput,
  CurrencyConversionOutput,
  UpdateExchangeRateInput,
} from '../application/exchange.dto';
import { ExchangeService } from '../application/exchange.service';
import { ExchangeRateEntity } from '../domain/exchange-rate.entity';

@Resolver(() => ExchangeRateEntity)
export class ExchangeResolver {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Query(() => [ExchangeRateEntity], { name: 'exchangeRates' })
  async findAll() {
    return this.exchangeService.findAll();
  }

  @Query(() => ExchangeRateEntity, { name: 'exchangeRate' })
  async findById(@Args('id', { type: () => String }) id: string) {
    return this.exchangeService.findById(id);
  }

  @Query(() => CurrencyConversionOutput, { name: 'convertCurrency' })
  async convert(@Args('input') input: ConvertCurrencyInput) {
    return this.exchangeService.convertInput(input);
  }

  @Mutation(() => ExchangeRateEntity)
  async createExchangeRate(@Args('input') input: CreateExchangeRateInput) {
    return this.exchangeService.create(input);
  }

  @Mutation(() => ExchangeRateEntity)
  async updateExchangeRate(@Args('input') input: UpdateExchangeRateInput) {
    return this.exchangeService.update(input);
  }

  @Mutation(() => Boolean)
  async deleteExchangeRate(@Args('id', { type: () => String }) id: string) {
    return this.exchangeService.remove(id);
  }
}
