import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';

jest.mock('uuid', () => {
  let counter = 0;

  return {
    v4: jest.fn(() => {
      counter += 1;
      return `00000000-0000-4000-8000-${counter
        .toString()
        .padStart(12, '0')}`;
    }),
    validate: jest.fn((value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
    ),
  };
});

describe('FX Transaction Flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const createdTransactionIds: string[] = [];
  const createdExchangeRateIds: string[] = [];
  const createdAccountIds: string[] = [];
  const createdClientIds: string[] = [];

  const suffix = `${Date.now()}`;

  beforeAll(async () => {
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_USER = 'postgres';
    process.env.DB_PASSWORD = 'postgres';
    process.env.DB_NAME = 'banking';
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.ELASTICSEARCH_NODE;

    const { AppModule } = await import('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: true,
      }),
    );

    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    for (const transactionId of createdTransactionIds) {
      await dataSource.query(
        'DELETE FROM "transaction_exchange_details" WHERE "transaction_id" = $1',
        [transactionId],
      );
      await dataSource.query('DELETE FROM "transactions" WHERE "id" = $1', [
        transactionId,
      ]);
    }

    for (const exchangeRateId of createdExchangeRateIds) {
      await dataSource.query('DELETE FROM "exchange_rates" WHERE "id" = $1', [
        exchangeRateId,
      ]);
    }

    for (const accountId of createdAccountIds) {
      await dataSource.query('DELETE FROM "accounts" WHERE "id" = $1', [
        accountId,
      ]);
    }

    for (const clientId of createdClientIds) {
      await dataSource.query('DELETE FROM "clients" WHERE "id" = $1', [
        clientId,
      ]);
    }

    await app.close();
  });

  it('creates an FX transfer and persists exchange details plus updated balances', async () => {
    const sourceClient = await executeGraphQL<{
      createClient: { id: string };
    }>(
      `
        mutation CreateClient($input: CreateClientInput!) {
          createClient(input: $input) {
            id
          }
        }
      `,
      {
        input: {
          firstName: 'Fx',
          lastName: 'Source',
          email: `fx-source-${suffix}@example.com`,
          documentNumber: '00112345678',
          phone: '809-555-0101',
          status: 'ACTIVE',
        },
      },
    );
    createdClientIds.push(sourceClient.createClient.id);

    const destinationClient = await executeGraphQL<{
      createClient: { id: string };
    }>(
      `
        mutation CreateClient($input: CreateClientInput!) {
          createClient(input: $input) {
            id
          }
        }
      `,
      {
        input: {
          firstName: 'Fx',
          lastName: 'Destination',
          email: `fx-destination-${suffix}@example.com`,
          documentNumber: '101234567',
          phone: '809-555-0102',
          status: 'ACTIVE',
        },
      },
    );
    createdClientIds.push(destinationClient.createClient.id);

    const sourceAccount = await executeGraphQL<{
      createAccount: { id: string; balance: number };
    }>(
      `
        mutation CreateAccount($input: CreateAccountInput!) {
          createAccount(input: $input) {
            id
            balance
          }
        }
      `,
      {
        input: {
          clientId: sourceClient.createClient.id,
          accountNumber: `1000${suffix}`,
          alias: 'FX Source DOP',
          currency: 'DOP',
          balance: 5000,
          status: 'ACTIVE',
        },
      },
    );
    createdAccountIds.push(sourceAccount.createAccount.id);

    const destinationAccount = await executeGraphQL<{
      createAccount: { id: string; balance: number };
    }>(
      `
        mutation CreateAccount($input: CreateAccountInput!) {
          createAccount(input: $input) {
            id
            balance
          }
        }
      `,
      {
        input: {
          clientId: destinationClient.createClient.id,
          accountNumber: `2000${suffix}`,
          alias: 'FX Destination USD',
          currency: 'USD',
          balance: 100,
          status: 'ACTIVE',
        },
      },
    );
    createdAccountIds.push(destinationAccount.createAccount.id);

    const exchangeRate = await executeGraphQL<{
      createExchangeRate: { id: string; rate: number };
    }>(
      `
        mutation CreateExchangeRate($input: CreateExchangeRateInput!) {
          createExchangeRate(input: $input) {
            id
            rate
          }
        }
      `,
      {
        input: {
          baseCurrency: 'DOP',
          quoteCurrency: 'USD',
          rate: 0.0169,
          effectiveAt: '2026-03-10T10:00:00.000Z',
        },
      },
    );
    createdExchangeRateIds.push(exchangeRate.createExchangeRate.id);

    const createdTransaction = await executeGraphQL<{
      createTransaction: {
        id: string;
        amount: number;
        sourcePreviousBalance: number;
        sourceCurrentBalance: number;
        destinationPreviousBalance: number | null;
        destinationCurrentBalance: number | null;
        exchangeDetails: {
          baseCurrency: string;
          quoteCurrency: string;
          sourceAmount: number;
          rate: number;
          convertedAmount: number;
        } | null;
      };
    }>(
      `
        mutation CreateTransaction($input: CreateTransactionInput!) {
          createTransaction(input: $input) {
            id
            amount
            sourcePreviousBalance
            sourceCurrentBalance
            destinationPreviousBalance
            destinationCurrentBalance
            exchangeDetails {
              baseCurrency
              quoteCurrency
              sourceAmount
              rate
              convertedAmount
            }
          }
        }
      `,
      {
        input: {
          sourceAccountId: sourceAccount.createAccount.id,
          destinationAccountId: destinationAccount.createAccount.id,
          type: 'TRANSFER',
          channel: 'WEB',
          currency: 'DOP',
          amount: 1000,
          reference: `FX-TRF-${suffix}`,
          description: 'FX transfer e2e',
          status: 'COMPLETED',
        },
      },
    );
    createdTransactionIds.push(createdTransaction.createTransaction.id);

    expect(createdTransaction.createTransaction.sourcePreviousBalance).toBe(5000);
    expect(createdTransaction.createTransaction.sourceCurrentBalance).toBe(4000);
    expect(createdTransaction.createTransaction.destinationPreviousBalance).toBe(100);
    expect(createdTransaction.createTransaction.destinationCurrentBalance).toBe(
      116.9,
    );
    expect(createdTransaction.createTransaction.exchangeDetails).toEqual({
      baseCurrency: 'DOP',
      quoteCurrency: 'USD',
      sourceAmount: 1000,
      rate: 0.0169,
      convertedAmount: 16.9,
    });

    const sourceAccountAfter = await executeGraphQL<{
      account: { id: string; balance: number; currency: string };
    }>(
      `
        query Account($id: String!) {
          account(id: $id) {
            id
            balance
            currency
          }
        }
      `,
      { id: sourceAccount.createAccount.id },
    );

    const destinationAccountAfter = await executeGraphQL<{
      account: { id: string; balance: number; currency: string };
    }>(
      `
        query Account($id: String!) {
          account(id: $id) {
            id
            balance
            currency
          }
        }
      `,
      { id: destinationAccount.createAccount.id },
    );

    const transactionById = await executeGraphQL<{
      transaction: {
        id: string;
        exchangeDetails: {
          baseCurrency: string;
          quoteCurrency: string;
          convertedAmount: number;
        } | null;
      };
    }>(
      `
        query Transaction($id: String!) {
          transaction(id: $id) {
            id
            exchangeDetails {
              baseCurrency
              quoteCurrency
              convertedAmount
            }
          }
        }
      `,
      { id: createdTransaction.createTransaction.id },
    );

    expect(sourceAccountAfter.account.balance).toBe(4000);
    expect(destinationAccountAfter.account.balance).toBe(116.9);
    expect(transactionById.transaction.exchangeDetails).toEqual({
      baseCurrency: 'DOP',
      quoteCurrency: 'USD',
      convertedAmount: 16.9,
    });
  });

  async function executeGraphQL<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query,
        variables,
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    return response.body.data as T;
  }
});
