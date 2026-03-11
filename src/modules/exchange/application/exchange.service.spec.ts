import { Currency } from '../../../common/domain/currency.enum';
import { AppException } from '../../../common/errors/app.exception';
import { ExchangeService } from './exchange.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '11111111-1111-4111-8111-111111111111'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    ),
  ),
}));

describe('ExchangeService', () => {
  const createRepositoryMock = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findDuplicate: jest.fn(),
    findLatest: jest.fn(),
    remove: jest.fn(),
  });

  it('creates an exchange rate when the pair is unique', async () => {
    const repository = createRepositoryMock();
    const service = new ExchangeService(repository as any);

    const effectiveAt = new Date('2026-03-10T10:00:00.000Z');

    repository.findDuplicate.mockResolvedValue(null);
    repository.create.mockImplementation((value) => value);
    repository.save.mockImplementation(async (value) => value);

    const result = await service.create({
      baseCurrency: Currency.DOP,
      quoteCurrency: Currency.USD,
      rate: 0.0169,
      effectiveAt,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseCurrency: Currency.DOP,
        quoteCurrency: Currency.USD,
        rate: 0.0169,
        effectiveAt,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        baseCurrency: Currency.DOP,
        quoteCurrency: Currency.USD,
        rate: 0.0169,
      }),
    );
  });

  it('converts with rate 1 when base and quote currencies are the same', async () => {
    const repository = createRepositoryMock();
    const service = new ExchangeService(repository as any);

    const result = await service.convert({
      amount: 500,
      baseCurrency: Currency.DOP,
      quoteCurrency: Currency.DOP,
    });

    expect(result).toEqual(
      expect.objectContaining({
        amount: 500,
        rate: 1,
        convertedAmount: 500,
        baseCurrency: Currency.DOP,
        quoteCurrency: Currency.DOP,
      }),
    );
    expect(repository.findLatest).not.toHaveBeenCalled();
  });

  it('converts using the latest stored exchange rate', async () => {
    const repository = createRepositoryMock();
    const service = new ExchangeService(repository as any);
    const effectiveAt = new Date('2026-03-10T10:00:00.000Z');

    repository.findLatest.mockResolvedValue({
      id: '87e5e85b-6cde-4c52-a1d3-f1336abdbbdd',
      baseCurrency: Currency.DOP,
      quoteCurrency: Currency.USD,
      rate: 0.0169,
      effectiveAt,
    });

    await expect(
      service.convert({
        amount: 1000,
        baseCurrency: Currency.DOP,
        quoteCurrency: Currency.USD,
      }),
    ).resolves.toEqual({
      amount: 1000,
      baseCurrency: Currency.DOP,
      quoteCurrency: Currency.USD,
      rate: 0.0169,
      convertedAmount: 16.9,
      effectiveAt,
    });
  });

  it('throws when no exchange rate exists for the conversion pair', async () => {
    const repository = createRepositoryMock();
    const service = new ExchangeService(repository as any);

    repository.findLatest.mockResolvedValue(null);

    await expect(
      service.convert({
        amount: 1000,
        baseCurrency: Currency.DOP,
        quoteCurrency: Currency.USD,
      }),
    ).rejects.toThrow(AppException);
  });
});
