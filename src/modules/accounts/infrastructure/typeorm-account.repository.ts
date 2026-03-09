import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Not, Repository } from 'typeorm';
import {
  AccountRepository,
  FindDuplicateAccountParams,
} from '../application/ports/account.repository';
import { AccountEntity } from '../domain/account.entity';

@Injectable()
export class TypeOrmAccountRepository implements AccountRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repository: Repository<AccountEntity>,
  ) {}

  create(data: Partial<AccountEntity>): AccountEntity {
    return this.repository.create(data);
  }

  save(account: AccountEntity): Promise<AccountEntity> {
    return this.repository.save(account);
  }

  findAll(): Promise<AccountEntity[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string): Promise<AccountEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  findDuplicate({
    accountNumber,
    excludeId,
  }: FindDuplicateAccountParams): Promise<AccountEntity | null> {
    return this.repository.findOne({
      where: excludeId
        ? {
            accountNumber,
            id: Not(excludeId),
          }
        : { accountNumber },
    });
  }

  findByIds(ids: string[]): Promise<AccountEntity[]> {
    return this.repository.find({
      where: { id: In(ids) },
      order: { createdAt: 'DESC' },
    });
  }

  searchByTerm(term: string): Promise<AccountEntity[]> {
    return this.repository.find({
      where: [
        { accountNumber: ILike(`%${term}%`) },
        { alias: ILike(`%${term}%`) },
        { clientId: ILike(`%${term}%`) },
      ],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async remove(account: AccountEntity): Promise<void> {
    await this.repository.remove(account);
  }
}
