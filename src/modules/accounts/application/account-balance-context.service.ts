import { Injectable } from '@nestjs/common';
import {
  AccountBalanceContext,
  AccountBalanceSnapshot,
  createAccountBalanceContext,
} from './account-balance.context';
import { AccountBalanceContextPort } from './ports/account-balance-context.port';

@Injectable()
export class AccountBalanceContextService
  implements AccountBalanceContextPort
{
  create(account: { id: string; balance: number }): AccountBalanceContext {
    return createAccountBalanceContext(account);
  }

  snapshot(
    sourceContext: AccountBalanceContext,
    destinationContext?: AccountBalanceContext | null,
  ): AccountBalanceSnapshot[] {
    return destinationContext
      ? [sourceContext.snapshot(), destinationContext.snapshot()]
      : [sourceContext.snapshot()];
  }
}
