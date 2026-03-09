import { AccountEntity } from '../../domain/account.entity';

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');

export interface FindDuplicateAccountParams {
  accountNumber: string;
  excludeId?: string;
}

export interface AccountRepository {
  create(data: Partial<AccountEntity>): AccountEntity;
  save(account: AccountEntity): Promise<AccountEntity>;
  findAll(): Promise<AccountEntity[]>;
  findById(id: string): Promise<AccountEntity | null>;
  findDuplicate(
    params: FindDuplicateAccountParams,
  ): Promise<AccountEntity | null>;
  findByIds(ids: string[]): Promise<AccountEntity[]>;
  searchByTerm(term: string): Promise<AccountEntity[]>;
  remove(account: AccountEntity): Promise<void>;
}
