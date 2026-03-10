import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountBalanceContextService } from './application/account-balance-context.service';
import { AccountService } from './application/account.service';
import { ACCOUNT_BALANCE_CONTEXT_PORT } from './application/ports/account-balance-context.port';
import { ACCOUNT_REPOSITORY } from './application/ports/account.repository';
import { AccountEntity } from './domain/account.entity';
import { TypeOrmAccountRepository } from './infrastructure/typeorm-account.repository';
import { AccountResolver } from './presentation/account.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  providers: [
    AccountBalanceContextService,
    AccountService,
    AccountResolver,
    TypeOrmAccountRepository,
    {
      provide: ACCOUNT_BALANCE_CONTEXT_PORT,
      useExisting: AccountBalanceContextService,
    },
    {
      provide: ACCOUNT_REPOSITORY,
      useExisting: TypeOrmAccountRepository,
    },
  ],
  exports: [AccountService, ACCOUNT_BALANCE_CONTEXT_PORT, TypeOrmModule],
})
export class AccountsModule {}
