import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { TransactionBalanceOrchestrator } from './application/transaction-balance.orchestrator';
import { TransactionService } from './application/transaction.service';
import { TRANSACTION_REPOSITORY } from './application/ports/transaction.repository';
import { TransactionEntity } from './domain/transaction.entity';
import { TypeOrmTransactionRepository } from './infrastructure/typeorm-transaction.repository';
import { TransactionResolver } from './presentation/transaction.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity]), AccountsModule],
  providers: [
    TransactionBalanceOrchestrator,
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
