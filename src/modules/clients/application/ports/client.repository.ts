import { ClientEntity } from '../../domain/client.entity';

export const CLIENT_REPOSITORY = Symbol('CLIENT_REPOSITORY');

export interface FindDuplicateClientParams {
  email: string;
  documentNumber: string;
  excludeId?: string;
}

export interface ClientRepository {
  create(data: Partial<ClientEntity>): ClientEntity;
  save(client: ClientEntity): Promise<ClientEntity>;
  findAll(): Promise<ClientEntity[]>;
  findById(id: string): Promise<ClientEntity | null>;
  findDuplicate(params: FindDuplicateClientParams): Promise<ClientEntity | null>;
  findByIds(ids: string[]): Promise<ClientEntity[]>;
  searchByTerm(term: string): Promise<ClientEntity[]>;
  remove(client: ClientEntity): Promise<void>;
}
