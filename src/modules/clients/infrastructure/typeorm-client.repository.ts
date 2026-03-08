import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Not, Repository } from 'typeorm';
import {
  ClientRepository,
  FindDuplicateClientParams,
} from '../application/ports/client.repository';
import { ClientEntity } from '../domain/client.entity';

@Injectable()
export class TypeOrmClientRepository implements ClientRepository {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly repository: Repository<ClientEntity>,
  ) {}

  create(data: Partial<ClientEntity>): ClientEntity {
    return this.repository.create(data);
  }

  save(client: ClientEntity): Promise<ClientEntity> {
    return this.repository.save(client);
  }

  findAll(): Promise<ClientEntity[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string): Promise<ClientEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  findDuplicate({
    email,
    documentNumber,
    excludeId,
  }: FindDuplicateClientParams): Promise<ClientEntity | null> {
    const conditions = excludeId
      ? [
          { email, id: Not(excludeId) },
          { documentNumber, id: Not(excludeId) },
        ]
      : [{ email }, { documentNumber }];

    return this.repository.findOne({
      where: conditions,
    });
  }

  findByIds(ids: string[]): Promise<ClientEntity[]> {
    return this.repository.find({
      where: { id: In(ids) },
      order: { createdAt: 'DESC' },
    });
  }

  searchByTerm(term: string): Promise<ClientEntity[]> {
    return this.repository.find({
      where: [
        { firstName: ILike(`%${term}%`) },
        { lastName: ILike(`%${term}%`) },
        { email: ILike(`%${term}%`) },
        { documentNumber: ILike(`%${term}%`) },
        { phone: ILike(`%${term}%`) },
      ],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async remove(client: ClientEntity): Promise<void> {
    await this.repository.remove(client);
  }
}
