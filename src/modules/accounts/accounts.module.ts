import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountService } from './application/account.service';
import { ACCOUNT_REPOSITORY } from './application/ports/account.repository';
import { AccountEntity } from './domain/account.entity';
import { TypeOrmAccountRepository } from './infrastructure/typeorm-account.repository';
import { AccountResolver } from './presentation/account.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  providers: [
    AccountService,
    AccountResolver,
    TypeOrmAccountRepository,
    {
      provide: ACCOUNT_REPOSITORY,
      useExisting: TypeOrmAccountRepository,
    },
  ],
  exports: [AccountService, TypeOrmModule],
})
export class AccountsModule {}
