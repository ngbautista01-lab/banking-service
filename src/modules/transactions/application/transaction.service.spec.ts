import { AppException } from '../../../common/errors/app.exception';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { SearchService } from '../../../infrastructure/search/search.service';
import { Currency } from '../../../common/domain/currency.enum';
import { DataSource } from 'typeorm';
import { AccountBalanceContextPort } from '../../accounts/application/ports/account-balance-context.port';
import { ExchangeContextPort } from '../../exchange/application/ports/exchange-context.port';
import { TransactionService } from './transaction.service';
import { TransactionExecutionOrchestrator } from './transaction-execution.orchestrator';
import {
  TransactionChannel,
  TransactionStatus,
  TransactionType,
} from '../domain/transaction.types';
import { TransactionRepository } from './ports/transaction.repository';
import { TransactionEntity } from '../domain/transaction.entity';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '11111111-1111-4111-8111-111111111111'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    ),
  ),
}));

describe('TransactionService', () => {
  type TransactionRepositoryMock = jest.Mocked<TransactionRepository>;

  const createTransactionRepositoryMock = (): TransactionRepositoryMock => ({
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
      {} as DataSource,
      transactionRepository,
      {
        create: jest.fn(),
        snapshot: jest.fn(),
      } as unknown as AccountBalanceContextPort,
      { createContext: jest.fn() } as unknown as ExchangeContextPort,
      {
        execute: jest.fn(),
        reverse: jest.fn(),
        captureSnapshots: jest.fn(),
      } as unknown as TransactionExecutionOrchestrator,
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

  const transaction: TransactionEntity = {
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
    expect(transactionRepository.findAll.mock.calls).toHaveLength(0);
  });

  it('loads all transactions from repository and caches them on cache miss', async () => {
    const { service, cacheService, transactionRepository } = createService();
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue(undefined);
    transactionRepository.findAll.mockResolvedValue([transaction]);

    await expect(service.findAll()).resolves.toEqual([transaction]);
    expect(cacheService.set.mock.calls[0]).toEqual([
      'transactions:v2:all',
      [transaction],
      60,
    ]);
  });

  it('returns a transaction by id and refreshes cache', async () => {
    const { service, cacheService, transactionRepository } = createService();
    cacheService.set.mockResolvedValue(undefined);
    cacheService.del.mockResolvedValue(undefined);
    transactionRepository.findById.mockResolvedValue(transaction);

    await expect(service.findById(transaction.id)).resolves.toEqual(
      transaction,
    );
    expect(transactionRepository.findById.mock.calls[0]).toEqual([
      transaction.id,
    ]);
    expect(cacheService.set.mock.calls[0]).toEqual([
      `transaction:v2:${transaction.id}`,
      transaction,
      120,
    ]);
  });

  it('uses indexed ids during transaction search when available', async () => {
    const { service, searchService, transactionRepository } = createService();
    searchService.searchTransactions.mockResolvedValue([transaction.id]);
    transactionRepository.findByIds.mockResolvedValue([transaction]);

    await expect(service.search({ term: 'DEP-001' })).resolves.toEqual([
      transaction,
    ]);
    expect(transactionRepository.findByIds.mock.calls[0]).toEqual([
      transaction.id,
    ]);
  });

  it('rejects removing a completed transaction', async () => {
    const { service, transactionRepository } = createService();
    transactionRepository.findById.mockResolvedValue(transaction);

    await expect(service.remove(transaction.id)).rejects.toThrow(AppException);
    expect(transactionRepository.remove.mock.calls).toHaveLength(0);
  });
});
