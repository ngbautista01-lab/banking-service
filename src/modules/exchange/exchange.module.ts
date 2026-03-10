import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EXCHANGE_CONTEXT_PORT } from './application/ports/exchange-context.port';
import { ExchangeService } from './application/exchange.service';
import { EXCHANGE_RATE_PORT } from './application/ports/exchange-rate.port';
import { EXCHANGE_RATE_REPOSITORY } from './application/ports/exchange-rate.repository';
import { ExchangeRateEntity } from './domain/exchange-rate.entity';
import { TypeOrmExchangeRateRepository } from './infrastructure/typeorm-exchange-rate.repository';
import { ExchangeResolver } from './presentation/exchange.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRateEntity])],
  providers: [
    ExchangeService,
    ExchangeResolver,
    TypeOrmExchangeRateRepository,
    {
      provide: EXCHANGE_RATE_REPOSITORY,
      useExisting: TypeOrmExchangeRateRepository,
    },
    {
      provide: EXCHANGE_RATE_PORT,
      useExisting: ExchangeService,
    },
    {
      provide: EXCHANGE_CONTEXT_PORT,
      useExisting: ExchangeService,
    },
  ],
  exports: [
    ExchangeService,
    EXCHANGE_CONTEXT_PORT,
    EXCHANGE_RATE_PORT,
    TypeOrmModule,
  ],
})
export class ExchangeModule {}
