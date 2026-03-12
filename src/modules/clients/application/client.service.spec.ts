import { AppException } from '../../../common/errors/app.exception';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { SearchService } from '../../../infrastructure/search/search.service';
import { Repository } from 'typeorm';
import { ClientEntity } from '../domain/client.entity';
import { ClientStatus } from '../domain/client.types';
import { ClientService } from './client.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '11111111-1111-4111-8111-111111111111'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    ),
  ),
}));

describe('ClientService', () => {
  type ClientRepositoryMock = jest.Mocked<
    Pick<
      Repository<ClientEntity>,
      'findOne' | 'create' | 'save' | 'find' | 'remove'
    >
  >;

  const createRepositoryMock = (): ClientRepositoryMock => ({
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  });

  const createCacheServiceMock = () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  });

  type SearchServiceMock = {
    indexClient: jest.Mock<void, [ClientEntity]>;
    searchClients: jest.Mock<Promise<string[]>, [string]>;
    removeClient: jest.Mock<void, [string]>;
  };

  const createSearchServiceMock = (): SearchServiceMock => ({
    indexClient: jest.fn<void, [ClientEntity]>(),
    searchClients: jest.fn<Promise<string[]>, [string]>(),
    removeClient: jest.fn<void, [string]>(),
  });

  it('creates a client, normalizes values and indexes it', async () => {
    const repository = createRepositoryMock();
    const cacheService = createCacheServiceMock();
    const searchService = createSearchServiceMock();
    const service = new ClientService(
      repository as unknown as Repository<ClientEntity>,
      cacheService as unknown as CacheService,
      searchService as unknown as SearchService,
    );

    repository.findOne.mockResolvedValue(null);
    repository.create.mockImplementation(
      (value): ClientEntity => value as ClientEntity,
    );
    repository.save.mockImplementation(
      (value): Promise<ClientEntity> =>
        Promise.resolve({
          ...(value as ClientEntity),
          id:
            (value as ClientEntity).id ??
            '11111111-1111-4111-8111-111111111111',
          createdAt: new Date('2026-03-10T10:00:00.000Z'),
          updatedAt: new Date('2026-03-10T10:00:00.000Z'),
        }),
    );
    cacheService.set.mockResolvedValue(undefined);
    cacheService.del.mockResolvedValue(undefined);
    searchService.indexClient.mockResolvedValue(undefined);

    const result = await service.create({
      firstName: 'Ana',
      lastName: 'Perez',
      email: 'ana@example.com',
      documentNumber: ' 001-1234567-8 ',
      phone: ' (809) 555-0101 ',
      status: ClientStatus.ACTIVE,
    });

    expect(repository.create.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        firstName: 'Ana',
        lastName: 'Perez',
        email: 'ana@example.com',
        documentNumber: '00112345678',
        phone: '(809) 555-0101',
      }),
    );
    expect(searchService.indexClient.mock.calls[0]?.[0]).toEqual(result);
    expect(cacheService.set.mock.calls[0]).toEqual([
      `client:v2:${result.id}`,
      result,
      120,
    ]);
  });

  it('returns the client by id from the repository and refreshes cache', async () => {
    const repository = createRepositoryMock();
    const cacheService = createCacheServiceMock();
    const searchService = createSearchServiceMock();
    const service = new ClientService(
      repository as unknown as Repository<ClientEntity>,
      cacheService as unknown as CacheService,
      searchService as unknown as SearchService,
    );

    const client = {
      id: '6c6ddc9e-7dce-49c6-9c84-d5d7547328ea',
      firstName: 'Ana',
      lastName: 'Perez',
      email: 'ana@example.com',
      documentNumber: '00112345678',
      phone: '8095550101',
      status: ClientStatus.ACTIVE,
      createdAt: new Date('2026-03-10T10:00:00.000Z'),
      updatedAt: new Date('2026-03-10T10:00:00.000Z'),
    };

    repository.findOne.mockResolvedValue(client);
    cacheService.set.mockResolvedValue(undefined);
    cacheService.del.mockResolvedValue(undefined);

    await expect(service.findById(client.id)).resolves.toEqual(client);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: client.id },
    });
    expect(cacheService.set).toHaveBeenCalledWith(
      `client:v2:${client.id}`,
      client,
      120,
    );
  });

  it('falls back to database search when the search index returns no ids', async () => {
    const repository = createRepositoryMock();
    const cacheService = createCacheServiceMock();
    const searchService = createSearchServiceMock();
    const service = new ClientService(
      repository as unknown as Repository<ClientEntity>,
      cacheService as unknown as CacheService,
      searchService as unknown as SearchService,
    );

    const clients = [
      {
        id: '6c6ddc9e-7dce-49c6-9c84-d5d7547328ea',
        firstName: 'Ana',
        lastName: 'Perez',
        email: 'ana@example.com',
        documentNumber: '00112345678',
        phone: '8095550101',
        status: ClientStatus.ACTIVE,
        createdAt: new Date('2026-03-10T10:00:00.000Z'),
        updatedAt: new Date('2026-03-10T10:00:00.000Z'),
      },
    ];

    searchService.searchClients.mockResolvedValue([]);
    repository.find.mockResolvedValue(clients);

    await expect(service.search({ term: 'ana' })).resolves.toEqual(clients);
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20,
      }),
    );
  });

  it('throws for an invalid client id', async () => {
    const service = new ClientService(
      createRepositoryMock() as unknown as Repository<ClientEntity>,
      createCacheServiceMock() as unknown as CacheService,
      createSearchServiceMock() as unknown as SearchService,
    );

    await expect(service.findById('invalid-id')).rejects.toThrow(AppException);
  });
});
