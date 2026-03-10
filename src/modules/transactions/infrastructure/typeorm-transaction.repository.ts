import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Not, Repository } from 'typeorm';
import {
  FindDuplicateTransactionParams,
  TransactionRepository,
} from '../application/ports/transaction.repository';
import { TransactionEntity } from '../domain/transaction.entity';

@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repository: Repository<TransactionEntity>,
  ) {}

  create(data: Partial<TransactionEntity>): TransactionEntity {
    return this.repository.create(data);
  }

  save(transaction: TransactionEntity): Promise<TransactionEntity> {
    return this.repository.save(transaction);
  }

  findAll(): Promise<TransactionEntity[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string): Promise<TransactionEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  findDuplicate({
    reference,
    excludeId,
  }: FindDuplicateTransactionParams): Promise<TransactionEntity | null> {
    return this.repository.findOne({
      where: excludeId
        ? {
            reference,
            id: Not(excludeId),
          }
        : { reference },
    });
  }

  findByIds(ids: string[]): Promise<TransactionEntity[]> {
    return this.repository.find({
      where: { id: In(ids) },
      order: { createdAt: 'DESC' },
    });
  }

  searchByTerm(term: string): Promise<TransactionEntity[]> {
    return this.repository.find({
      where: [
        { reference: ILike(`%${term}%`) },
        { description: ILike(`%${term}%`) },
      ],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async remove(transaction: TransactionEntity): Promise<void> {
    await this.repository.remove(transaction);
  }

}
