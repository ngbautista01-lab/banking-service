import { TransactionEntity } from '../../domain/transaction.entity';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface FindDuplicateTransactionParams {
  reference: string;
  excludeId?: string;
}

export interface TransactionRepository {
  create(data: Partial<TransactionEntity>): TransactionEntity;
  save(transaction: TransactionEntity): Promise<TransactionEntity>;
  findAll(): Promise<TransactionEntity[]>;
  findById(id: string): Promise<TransactionEntity | null>;
  findDuplicate(
    params: FindDuplicateTransactionParams,
  ): Promise<TransactionEntity | null>;
  findByIds(ids: string[]): Promise<TransactionEntity[]>;
  searchByTerm(term: string): Promise<TransactionEntity[]>;
  remove(transaction: TransactionEntity): Promise<void>;
}
