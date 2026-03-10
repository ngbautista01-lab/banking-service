import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4, validate as isUuid } from 'uuid';
import { ILike, In, Not, Repository } from 'typeorm';
import { AppException } from '../../../common/errors/app.exception';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { SearchService } from '../../../infrastructure/search/search.service';
import {
  CreateClientInput,
  SearchClientsInput,
  UpdateClientInput,
} from './client.dto';
import { ClientEntity } from '../domain/client.entity';
import { ClientRules } from '../domain/client.rules';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
    private readonly cacheService: CacheService,
    private readonly searchService: SearchService,
  ) {}

  async create(input: CreateClientInput): Promise<ClientEntity> {
    const normalizedDocumentNumber = ClientRules.normalizeDocumentNumber(
      input.documentNumber,
    );

    const existingClient = await this.clientRepository.findOne({
      where: [{ email: input.email }, { documentNumber: normalizedDocumentNumber }],
    });

    ClientRules.ensureIsUnique(existingClient);
    ClientRules.validateDocumentNumber(normalizedDocumentNumber);

    const client = this.clientRepository.create({
      id: uuidv4(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      status: input.status,
      documentNumber: normalizedDocumentNumber,
      phone: ClientRules.normalizePhone(input.phone),
    });

    const savedClient = await this.clientRepository.save(client);
    await Promise.all([
      this.cacheClient(savedClient),
      this.searchService.indexClient(savedClient),
    ]);
    return savedClient;
  }

  async findAll(): Promise<ClientEntity[]> {
    const cacheKey = this.collectionCacheKey();
    const cachedClients = await this.cacheService.get<ClientEntity[]>(cacheKey);
    if (cachedClients) {
      return cachedClients;
    }

    const clients = await this.clientRepository.find({
      order: { createdAt: 'DESC' },
    });

    await this.cacheService.set(cacheKey, clients, 60);
    return clients;
  }

  async findById(id: string): Promise<ClientEntity> {
    if (!id || !isUuid(id)) {
      throw new AppException('CLIENT_NOT_FOUND');
    }

    const cacheKey = this.clientCacheKey(id);
    const cachedClient = await this.cacheService.get<ClientEntity>(cacheKey);
    if (cachedClient) {
      return cachedClient;
    }

    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) {
      throw new AppException('CLIENT_NOT_FOUND');
    }

    await this.cacheClient(client);
    return client;
  }

  async search(input: SearchClientsInput): Promise<ClientEntity[]> {
    const ids = await this.searchService.searchClients(input.term);
    if (ids.length > 0) {
      return this.clientRepository.find({
        where: { id: In(ids) },
        order: { createdAt: 'DESC' },
      });
    }

    return this.clientRepository.find({
      where: [
        { firstName: ILike(`%${input.term}%`) },
        { lastName: ILike(`%${input.term}%`) },
        { email: ILike(`%${input.term}%`) },
        { documentNumber: ILike(`%${input.term}%`) },
        { phone: ILike(`%${input.term}%`) },
      ],
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async update(input: UpdateClientInput): Promise<ClientEntity> {
    const client = await this.getClientOrThrow(input.id);

    const nextDocumentNumber =
      input.documentNumber !== undefined
        ? ClientRules.normalizeDocumentNumber(input.documentNumber)
        : client.documentNumber;
    const nextEmail = input.email ?? client.email;

    const existingClient = await this.clientRepository.findOne({
      where: [
        { email: nextEmail, id: Not(client.id) },
        { documentNumber: nextDocumentNumber, id: Not(client.id) },
      ],
    });

    ClientRules.ensureIsUnique(existingClient);
    ClientRules.validateDocumentNumber(nextDocumentNumber);

    const mergedClient = this.clientRepository.merge(client, {
      firstName: input.firstName ?? client.firstName,
      lastName: input.lastName ?? client.lastName,
      email: nextEmail,
      documentNumber: nextDocumentNumber,
      phone:
        input.phone !== undefined
          ? ClientRules.normalizePhone(input.phone)
          : client.phone,
      status: input.status ?? client.status,
    });

    const savedClient = await this.clientRepository.save(mergedClient);
    await Promise.all([
      this.cacheClient(savedClient),
      this.searchService.indexClient(savedClient),
    ]);

    return savedClient;
  }

  async remove(id: string): Promise<boolean> {
    const client = await this.getClientOrThrow(id);
    await this.clientRepository.remove(client);
    await Promise.all([
      this.cacheService.del(this.clientCacheKey(id)),
      this.cacheService.del(this.collectionCacheKey()),
      this.searchService.removeClient(id),
    ]);
    return true;
  }

  private async cacheClient(client: ClientEntity): Promise<void> {
    await Promise.all([
      this.cacheService.set(this.clientCacheKey(client.id), client, 120),
      this.cacheService.del(this.collectionCacheKey()),
    ]);
  }

  private clientCacheKey(id: string): string {
    return `client:v2:${id}`;
  }

  private collectionCacheKey(): string {
    return 'clients:v2:all';
  }

  private async getClientOrThrow(id: string): Promise<ClientEntity> {
    if (!id || !isUuid(id)) {
      throw new AppException('CLIENT_NOT_FOUND');
    }

    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) {
      throw new AppException('CLIENT_NOT_FOUND');
    }

    return client;
  }
}
