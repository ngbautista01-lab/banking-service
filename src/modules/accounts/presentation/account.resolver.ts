import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AccountEntity } from '../domain/account.entity';
import { AccountService } from '../application/account.service';
import {
  CreateAccountInput,
  SearchAccountsInput,
  UpdateAccountInput,
} from '../application/account.dto';

@Resolver(() => AccountEntity)
export class AccountResolver {
  constructor(private readonly accountService: AccountService) {}

  @Query(() => [AccountEntity], { name: 'accounts' })
  async findAll() {
    return this.accountService.findAll();
  }

  @Query(() => AccountEntity, { name: 'account' })
  async findById(@Args('id', { type: () => String }) id: string) {
    return this.accountService.findById(id);
  }

  @Query(() => [AccountEntity], { name: 'searchAccounts' })
  async search(@Args('input') input: SearchAccountsInput) {
    return this.accountService.search(input);
  }

  @Mutation(() => AccountEntity)
  async createAccount(@Args('input') input: CreateAccountInput) {
    return this.accountService.create(input);
  }

  @Mutation(() => AccountEntity)
  async updateAccount(@Args('input') input: UpdateAccountInput) {
    return this.accountService.update(input);
  }

  @Mutation(() => Boolean)
  async deleteAccount(@Args('id', { type: () => String }) id: string) {
    return this.accountService.remove(id);
  }
}
