import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TransactionService } from '../application/transaction.service';
import {
  CreateTransactionInput,
  SearchTransactionsInput,
  UpdateTransactionInput,
} from '../application/transaction.dto';
import { TransactionEntity } from '../domain/transaction.entity';

@Resolver(() => TransactionEntity)
export class TransactionResolver {
  constructor(private readonly transactionService: TransactionService) {}

  @Query(() => [TransactionEntity], { name: 'transactions' })
  async findAll() {
    return this.transactionService.findAll();
  }

  @Query(() => TransactionEntity, { name: 'transaction' })
  async findById(@Args('id', { type: () => String }) id: string) {
    return this.transactionService.findById(id);
  }

  @Query(() => [TransactionEntity], { name: 'searchTransactions' })
  async search(@Args('input') input: SearchTransactionsInput) {
    return this.transactionService.search(input);
  }

  @Mutation(() => TransactionEntity)
  async createTransaction(@Args('input') input: CreateTransactionInput) {
    return this.transactionService.create(input);
  }

  @Mutation(() => TransactionEntity)
  async updateTransaction(@Args('input') input: UpdateTransactionInput) {
    return this.transactionService.update(input);
  }

  @Mutation(() => Boolean)
  async deleteTransaction(@Args('id', { type: () => String }) id: string) {
    return this.transactionService.remove(id);
  }
}
