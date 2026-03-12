import { AppException } from '../../../common/errors/app.exception';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { SearchService } from '../../../infrastructure/search/search.service';
import { Currency } from '../../../common/domain/currency.enum';
import { TransactionService } from './transaction.service';
import {
  TransactionChannel,
  TransactionStatus,
  TransactionType,
} from '../domain/transaction.types';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '11111111-1111-4111-8111-111111111111'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    ),
  ),
}));

describe('TransactionService', () => {
  const createTransactionRepositoryMock = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByReference: jest.fn(),
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
    indexTransaction: jest.fn(),
    searchTransactions: jest.fn(),
    removeTransaction: jest.fn(),
    indexAccount: jest.fn(),
  });

  const createService = () => {
    const transactionRepository = createTransactionRepositoryMock();
    const cacheService = createCacheServiceMock();
    const searchService = createSearchServiceMock();
    const service = new TransactionService(
      {} as any,
      transactionRepository as any,
      { create: jest.fn() } as any,
      { createContext: jest.fn() } as any,
      {
        execute: jest.fn(),
        reverse: jest.fn(),
        captureSnapshots: jest.fn(),
      } as any,
      cacheService as unknown as CacheService,
      searchService as unknown as SearchService,
    );

    return {
      service,
      transactionRepository,
      cacheService,
      searchService,
    };
  };

  const transaction = {
    id: '4268d7e6-d342-4f91-9019-eda9b7a0514b',
    sourceAccountId: '55cbd2f0-19b0-4a96-bd36-d59c5c738179',
    destinationAccountId: null,
    type: TransactionType.DEPOSIT,
    channel: TransactionChannel.WEB,
    currency: Currency.DOP,
    amount: 500,
    reference: 'DEP-001',
    description: 'Deposito',
    status: TransactionStatus.COMPLETED,
    exchangeDetails: null,
    sourcePreviousBalance: 1000,
    sourceCurrentBalance: 1500,
    destinationPreviousBalance: null,
    destinationCurrentBalance: null,
    createdAt: new Date('2026-03-10T10:00:00.000Z'),
    updatedAt: new Date('2026-03-10T10:00:00.000Z'),
  };

  it('returns all transactions from cache when available', async () => {
    const { service, cacheService, transactionRepository } = createService();
    cacheService.get.mockResolvedValue([transaction]);

    await expect(service.findAll()).resolves.toEqual([transaction]);
    expect(transactionRepository.findAll).not.toHaveBeenCalled();
  });

  it('loads all transactions from repository and caches them on cache miss', async () => {
    const { service, cacheService, transactionRepository } = createService();
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue(undefined);
    transactionRepository.findAll.mockResolvedValue([transaction]);

    await expect(service.findAll()).resolves.toEqual([transaction]);
    expect(cacheService.set).toHaveBeenCalledWith(
      'transactions:v2:all',
      [transaction],
      60,
    );
  });

  it('returns a transaction by id and refreshes cache', async () => {
    const { service, cacheService, transactionRepository } = createService();
    cacheService.set.mockResolvedValue(undefined);
    cacheService.del.mockResolvedValue(undefined);
    transactionRepository.findById.mockResolvedValue(transaction);

    await expect(service.findById(transaction.id)).resolves.toEqual(transaction);
    expect(transactionRepository.findById).toHaveBeenCalledWith(transaction.id);
    expect(cacheService.set).toHaveBeenCalledWith(
      `transaction:v2:${transaction.id}`,
      transaction,
      120,
    );
  });

  it('returns a transaction by reference when the identifier is not a uuid', async () => {
    const { service, cacheService, transactionRepository } = createService();
    cacheService.set.mockResolvedValue(undefined);
    cacheService.del.mockResolvedValue(undefined);
    transactionRepository.findByReference.mockResolvedValue(transaction);

    await expect(service.findById(' dep-001 ')).resolves.toEqual(transaction);
    expect(transactionRepository.findByReference).toHaveBeenCalledWith('DEP-001');
  });

  it('falls back to reference lookup when a uuid-shaped identifier is not found by id', async () => {
    const { service, cacheService, transactionRepository } = createService();
    cacheService.set.mockResolvedValue(undefined);
    cacheService.del.mockResolvedValue(undefined);
    transactionRepository.findById.mockResolvedValue(null);
    transactionRepository.findByReference.mockResolvedValue(transaction);

    await expect(
      service.findById('4268d7e6-d342-4f91-9019-eda9b7a0514b'),
    ).resolves.toEqual(transaction);
    expect(transactionRepository.findById).toHaveBeenCalledWith(
      '4268d7e6-d342-4f91-9019-eda9b7a0514b',
    );
    expect(transactionRepository.findByReference).toHaveBeenCalledWith(
      '4268D7E6-D342-4F91-9019-EDA9B7A0514B',
    );
  });

  it('uses indexed ids during transaction search when available', async () => {
    const { service, searchService, transactionRepository } = createService();
    searchService.searchTransactions.mockResolvedValue([transaction.id]);
    transactionRepository.findByIds.mockResolvedValue([transaction]);

    await expect(service.search({ term: 'DEP-001' })).resolves.toEqual([
      transaction,
    ]);
    expect(transactionRepository.findByIds).toHaveBeenCalledWith([
      transaction.id,
    ]);
  });

  it('rejects removing a completed transaction', async () => {
    const { service, transactionRepository } = createService();
    transactionRepository.findById.mockResolvedValue(transaction);

    await expect(service.remove(transaction.id)).rejects.toThrow(AppException);
    expect(transactionRepository.remove).not.toHaveBeenCalled();
  });
});
