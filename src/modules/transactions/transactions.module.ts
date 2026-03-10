import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { ExchangeModule } from '../exchange/exchange.module';
import { TransactionExecutionOrchestrator } from './application/transaction-execution.orchestrator';
import { TransactionService } from './application/transaction.service';
import { TRANSACTION_REPOSITORY } from './application/ports/transaction.repository';
import { TransactionExchangeDetailEntity } from './domain/transaction-exchange-detail.entity';
import { TransactionEntity } from './domain/transaction.entity';
import { TypeOrmTransactionRepository } from './infrastructure/typeorm-transaction.repository';
import { TransactionResolver } from './presentation/transaction.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEntity]),
    TypeOrmModule.forFeature([TransactionExchangeDetailEntity]),
    AccountsModule,
    ExchangeModule,
  ],
  providers: [
    TransactionExecutionOrchestrator,
    TransactionService,
    TransactionResolver,
    TypeOrmTransactionRepository,
    {
      provide: TRANSACTION_REPOSITORY,
      useExisting: TypeOrmTransactionRepository,
    },
  ],
  exports: [TransactionService, TypeOrmModule],
})
export class TransactionsModule {}
