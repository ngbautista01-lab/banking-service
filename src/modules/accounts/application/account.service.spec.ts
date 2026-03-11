import { AppException } from '../../../common/errors/app.exception';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { SearchService } from '../../../infrastructure/search/search.service';
import { Currency } from '../../../common/domain/currency.enum';
import { AccountStatus } from '../domain/account.types';
import { AccountService } from './account.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '11111111-1111-4111-8111-111111111111'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    ),
  ),
}));

describe('AccountService', () => {
  const createRepositoryMock = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findDuplicate: jest.fn(),
    findByIds: jest.fn(),
    searchByTerm: jest.fn(),
    remove: jest.fn(),
  });

  const createCacheServiceMock = () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  });

  const createSearchServiceMock = () => ({
    indexAccount: jest.fn(),
    searchAccounts: jest.fn(),
    removeAccount: jest.fn(),
  });

  it('creates an account, normalizes account number and indexes it', async () => {
    const repository = createRepositoryMock();
    const cacheService = createCacheServiceMock();
    const searchService = createSearchServiceMock();
    const service = new AccountService(
      repository as any,
      cacheService as unknown as CacheService,
      searchService as unknown as SearchService,
    );

    repository.findDuplicate.mockResolvedValue(null);
    repository.create.mockImplementation((value) => value);
    repository.save.mockImplementation(async (value) => ({
      ...value,
      createdAt: new Date('2026-03-10T10:00:00.000Z'),
      updatedAt: new Date('2026-03-10T10:00:00.000Z'),
    }));
    cacheService.set.mockResolvedValue(undefined);
    cacheService.del.mockResolvedValue(undefined);
    searchService.indexAccount.mockResolvedValue(undefined);

    const result = await service.create({
      clientId: '6c6ddc9e-7dce-49c6-9c84-d5d7547328ea',
      accountNumber: ' 0001 2345 6789 ',
      alias: 'Cuenta principal',
      currency: Currency.DOP,
      balance: 1500,
      status: AccountStatus.ACTIVE,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        accountNumber: '000123456789',
        alias: 'Cuenta principal',
        currency: Currency.DOP,
        balance: 1500,
      }),
    );
    expect(searchService.indexAccount).toHaveBeenCalledWith(result);
    expect(cacheService.set).toHaveBeenCalledWith(
      `account:v2:${result.id}`,
      result,
      120,
    );
  });

  it('returns an account by id from the repository and refreshes cache', async () => {
    const repository = createRepositoryMock();
    const cacheService = createCacheServiceMock();
    const searchService = createSearchServiceMock();
    const service = new AccountService(
      repository as any,
      cacheService as unknown as CacheService,
      searchService as unknown as SearchService,
    );

    const account = {
      id: '6c6ddc9e-7dce-49c6-9c84-d5d7547328ea',
      clientId: 'fd95e7cc-db5b-4d1c-856e-af737b18e36d',
      accountNumber: '000123456789',
      alias: 'Cuenta principal',
      currency: Currency.DOP,
      balance: 1500,
      status: AccountStatus.ACTIVE,
    };

    repository.findById.mockResolvedValue(account);
    cacheService.set.mockResolvedValue(undefined);
    cacheService.del.mockResolvedValue(undefined);

    await expect(service.findById(account.id)).resolves.toEqual(account);
    expect(cacheService.set).toHaveBeenCalledWith(
      `account:v2:${account.id}`,
      account,
      120,
    );
  });

  it('returns search results by indexed ids when search finds matches', async () => {
    const repository = createRepositoryMock();
    const cacheService = createCacheServiceMock();
    const searchService = createSearchServiceMock();
    const service = new AccountService(
      repository as any,
      cacheService as unknown as CacheService,
      searchService as unknown as SearchService,
    );

    const accounts = [
      {
        id: '6c6ddc9e-7dce-49c6-9c84-d5d7547328ea',
        clientId: 'fd95e7cc-db5b-4d1c-856e-af737b18e36d',
        accountNumber: '000123456789',
        alias: 'Cuenta principal',
        currency: Currency.DOP,
        balance: 1500,
        status: AccountStatus.ACTIVE,
      },
    ];

    searchService.searchAccounts.mockResolvedValue([accounts[0].id]);
    repository.findByIds.mockResolvedValue(accounts);

    await expect(service.search({ term: 'principal' })).resolves.toEqual(
      accounts,
    );
    expect(repository.findByIds).toHaveBeenCalledWith([accounts[0].id]);
  });

  it('throws for an invalid account id', async () => {
    const service = new AccountService(
      createRepositoryMock() as any,
      createCacheServiceMock() as unknown as CacheService,
      createSearchServiceMock() as unknown as SearchService,
    );

    await expect(service.findById('invalid-id')).rejects.toThrow(AppException);
  });
});
