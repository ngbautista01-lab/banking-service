import { randomUUID } from 'crypto';
import AppDataSource from '../infrastructure/database/typeorm.config';
import { Currency } from '../common/domain/currency.enum';
import { AccountEntity } from '../modules/accounts/domain/account.entity';
import { AccountStatus } from '../modules/accounts/domain/account.types';
import { ClientEntity } from '../modules/clients/domain/client.entity';
import { ClientRules } from '../modules/clients/domain/client.rules';
import { ClientStatus } from '../modules/clients/domain/client.types';
import { ExchangeRateEntity } from '../modules/exchange/domain/exchange-rate.entity';
import { TransactionExchangeDetailEntity } from '../modules/transactions/domain/transaction-exchange-detail.entity';
import { TransactionEntity } from '../modules/transactions/domain/transaction.entity';
import {
  TransactionChannel,
  TransactionStatus,
  TransactionType,
} from '../modules/transactions/domain/transaction.types';

const seedClients = [
  {
    firstName: 'Ana',
    lastName: 'Perez',
    documentNumber: '00112345678',
    email: 'ana.perez@example.com',
    phone: '8095550101',
    status: ClientStatus.ACTIVE,
  },
  {
    firstName: 'Luis',
    lastName: 'Garcia',
    documentNumber: '101234567',
    email: 'luis.garcia@example.com',
    phone: '8095550102',
    status: ClientStatus.ACTIVE,
  },
  {
    firstName: 'Marta',
    lastName: 'Lopez',
    documentNumber: '40212345678',
    email: 'marta.lopez@example.com',
    phone: '8095550103',
    status: ClientStatus.ACTIVE,
  },
] as const;

const seedAccounts = [
  {
    accountNumber: 'SEED-DOP-0001',
    alias: 'Cuenta principal DOP Ana',
    currency: Currency.DOP,
    balance: 8875,
    status: AccountStatus.ACTIVE,
    clientEmail: 'ana.perez@example.com',
  },
  {
    accountNumber: 'SEED-USD-0001',
    alias: 'Cuenta ahorro USD Ana',
    currency: Currency.USD,
    balance: 313.5,
    status: AccountStatus.ACTIVE,
    clientEmail: 'ana.perez@example.com',
  },
  {
    accountNumber: 'SEED-DOP-0002',
    alias: 'Cuenta operativa DOP Luis',
    currency: Currency.DOP,
    balance: 8250,
    status: AccountStatus.ACTIVE,
    clientEmail: 'luis.garcia@example.com',
  },
  {
    accountNumber: 'SEED-EUR-0001',
    alias: 'Cuenta EUR Marta',
    currency: Currency.EUR,
    balance: 550,
    status: AccountStatus.ACTIVE,
    clientEmail: 'marta.lopez@example.com',
  },
] as const;

const rateEffectiveAt = new Date('2026-03-10T00:00:00.000Z');

interface SeedExchangeDetail {
  baseCurrency: Currency;
  quoteCurrency: Currency;
  sourceAmount: number;
  rate: number;
  convertedAmount: number;
  effectiveAt: Date;
}

interface SeedTransaction {
  reference: string;
  type: TransactionType;
  channel: TransactionChannel;
  currency: Currency;
  amount: number;
  description: string;
  status: TransactionStatus;
  sourceAccountNumber: string;
  destinationAccountNumber: string | null;
  sourcePreviousBalance: number;
  sourceCurrentBalance: number;
  destinationPreviousBalance: number | null;
  destinationCurrentBalance: number | null;
  exchangeDetail?: SeedExchangeDetail;
}

const seedExchangeRates = [
  {
    baseCurrency: Currency.DOP,
    quoteCurrency: Currency.USD,
    rate: 0.018,
    effectiveAt: rateEffectiveAt,
  },
  {
    baseCurrency: Currency.USD,
    quoteCurrency: Currency.DOP,
    rate: 55.56,
    effectiveAt: rateEffectiveAt,
  },
  {
    baseCurrency: Currency.EUR,
    quoteCurrency: Currency.DOP,
    rate: 67.5,
    effectiveAt: rateEffectiveAt,
  },
  {
    baseCurrency: Currency.DOP,
    quoteCurrency: Currency.EUR,
    rate: 0.014815,
    effectiveAt: rateEffectiveAt,
  },
  {
    baseCurrency: Currency.USD,
    quoteCurrency: Currency.EUR,
    rate: 0.92,
    effectiveAt: rateEffectiveAt,
  },
  {
    baseCurrency: Currency.EUR,
    quoteCurrency: Currency.USD,
    rate: 1.087,
    effectiveAt: rateEffectiveAt,
  },
] as const;

const seedTransactions: SeedTransaction[] = [
  {
    reference: 'SEED-DEP-0001',
    type: TransactionType.DEPOSIT,
    channel: TransactionChannel.BRANCH,
    currency: Currency.DOP,
    amount: 2000,
    description: 'Deposito inicial de seed',
    status: TransactionStatus.COMPLETED,
    sourceAccountNumber: 'SEED-DOP-0001',
    destinationAccountNumber: null,
    sourcePreviousBalance: 5000,
    sourceCurrentBalance: 7000,
    destinationPreviousBalance: null,
    destinationCurrentBalance: null,
  },
  {
    reference: 'SEED-WTD-0001',
    type: TransactionType.WITHDRAWAL,
    channel: TransactionChannel.ATM,
    currency: Currency.DOP,
    amount: 500,
    description: 'Retiro de seed',
    status: TransactionStatus.COMPLETED,
    sourceAccountNumber: 'SEED-DOP-0001',
    destinationAccountNumber: null,
    sourcePreviousBalance: 7000,
    sourceCurrentBalance: 6500,
    destinationPreviousBalance: null,
    destinationCurrentBalance: null,
  },
  {
    reference: 'SEED-TRF-0001',
    type: TransactionType.TRANSFER,
    channel: TransactionChannel.WEB,
    currency: Currency.DOP,
    amount: 1000,
    description: 'Transferencia DOP seed',
    status: TransactionStatus.COMPLETED,
    sourceAccountNumber: 'SEED-DOP-0001',
    destinationAccountNumber: 'SEED-DOP-0002',
    sourcePreviousBalance: 6500,
    sourceCurrentBalance: 5500,
    destinationPreviousBalance: 8000,
    destinationCurrentBalance: 9000,
  },
  {
    reference: 'SEED-FX-0001',
    type: TransactionType.TRANSFER,
    channel: TransactionChannel.MOBILE,
    currency: Currency.DOP,
    amount: 750,
    description: 'Transferencia DOP a USD seed',
    status: TransactionStatus.COMPLETED,
    sourceAccountNumber: 'SEED-DOP-0002',
    destinationAccountNumber: 'SEED-USD-0001',
    sourcePreviousBalance: 9000,
    sourceCurrentBalance: 8250,
    destinationPreviousBalance: 300,
    destinationCurrentBalance: 313.5,
    exchangeDetail: {
      baseCurrency: Currency.DOP,
      quoteCurrency: Currency.USD,
      sourceAmount: 750,
      rate: 0.018,
      convertedAmount: 13.5,
      effectiveAt: rateEffectiveAt,
    },
  },
  {
    reference: 'SEED-FX-0002',
    type: TransactionType.TRANSFER,
    channel: TransactionChannel.API,
    currency: Currency.EUR,
    amount: 50,
    description: 'Transferencia EUR a DOP seed',
    status: TransactionStatus.COMPLETED,
    sourceAccountNumber: 'SEED-EUR-0001',
    destinationAccountNumber: 'SEED-DOP-0001',
    sourcePreviousBalance: 600,
    sourceCurrentBalance: 550,
    destinationPreviousBalance: 5500,
    destinationCurrentBalance: 8875,
    exchangeDetail: {
      baseCurrency: Currency.EUR,
      quoteCurrency: Currency.DOP,
      sourceAmount: 50,
      rate: 67.5,
      convertedAmount: 3375,
      effectiveAt: rateEffectiveAt,
    },
  },
  {
    reference: 'SEED-PND-0001',
    type: TransactionType.WITHDRAWAL,
    channel: TransactionChannel.WEB,
    currency: Currency.USD,
    amount: 25,
    description: 'Transaccion pendiente de seed',
    status: TransactionStatus.PENDING,
    sourceAccountNumber: 'SEED-USD-0001',
    destinationAccountNumber: null,
    sourcePreviousBalance: 313.5,
    sourceCurrentBalance: 313.5,
    destinationPreviousBalance: null,
    destinationCurrentBalance: null,
  },
] as const;

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  try {
    await AppDataSource.transaction(async (manager) => {
      const clientRepository = manager.getRepository(ClientEntity);
      const accountRepository = manager.getRepository(AccountEntity);
      const exchangeRateRepository = manager.getRepository(ExchangeRateEntity);
      const transactionRepository = manager.getRepository(TransactionEntity);
      const exchangeDetailRepository = manager.getRepository(
        TransactionExchangeDetailEntity,
      );

      const clientsByEmail = new Map<string, ClientEntity>();

      for (const seedClient of seedClients) {
        const documentNumber = ClientRules.normalizeDocumentNumber(
          seedClient.documentNumber,
        );
        ClientRules.validateDocumentNumber(documentNumber);

        const existingClient = await clientRepository.findOne({
          where: [{ email: seedClient.email }, { documentNumber }],
        });

        const client = clientRepository.create({
          id: existingClient?.id ?? randomUUID(),
          ...seedClient,
          documentNumber,
          phone: ClientRules.normalizePhone(seedClient.phone),
        });

        const savedClient = await clientRepository.save(client);
        clientsByEmail.set(savedClient.email, savedClient);
      }

      const accountsByNumber = new Map<string, AccountEntity>();

      for (const seedAccount of seedAccounts) {
        const client = clientsByEmail.get(seedAccount.clientEmail);
        if (!client) {
          throw new Error(`Client not found for ${seedAccount.accountNumber}`);
        }

        const existingAccount = await accountRepository.findOne({
          where: { accountNumber: seedAccount.accountNumber },
        });

        const account = accountRepository.create({
          id: existingAccount?.id ?? randomUUID(),
          clientId: client.id,
          accountNumber: seedAccount.accountNumber,
          alias: seedAccount.alias,
          currency: seedAccount.currency,
          balance: seedAccount.balance,
          status: seedAccount.status,
        });

        const savedAccount = await accountRepository.save(account);
        accountsByNumber.set(savedAccount.accountNumber, savedAccount);
      }

      for (const seedRate of seedExchangeRates) {
        const existingRate = await exchangeRateRepository.findOne({
          where: {
            baseCurrency: seedRate.baseCurrency,
            quoteCurrency: seedRate.quoteCurrency,
            effectiveAt: seedRate.effectiveAt,
          },
        });

        const rate = exchangeRateRepository.create({
          id: existingRate?.id ?? randomUUID(),
          ...seedRate,
        });

        await exchangeRateRepository.save(rate);
      }

      for (const seedTransaction of seedTransactions) {
        const sourceAccount = accountsByNumber.get(seedTransaction.sourceAccountNumber);
        const destinationAccount = seedTransaction.destinationAccountNumber
          ? accountsByNumber.get(seedTransaction.destinationAccountNumber)
          : null;

        if (!sourceAccount) {
          throw new Error(
            `Source account not found for ${seedTransaction.reference}`,
          );
        }

        if (seedTransaction.destinationAccountNumber && !destinationAccount) {
          throw new Error(
            `Destination account not found for ${seedTransaction.reference}`,
          );
        }

        const existingTransaction = await transactionRepository.findOne({
          where: { reference: seedTransaction.reference },
        });

        const transaction = transactionRepository.create({
          id: existingTransaction?.id ?? randomUUID(),
          sourceAccountId: sourceAccount.id,
          destinationAccountId: destinationAccount?.id ?? null,
          type: seedTransaction.type,
          channel: seedTransaction.channel,
          currency: seedTransaction.currency,
          amount: seedTransaction.amount,
          reference: seedTransaction.reference,
          description: seedTransaction.description,
          status: seedTransaction.status,
          exchangeDetails: existingTransaction?.exchangeDetails ?? null,
          sourcePreviousBalance: seedTransaction.sourcePreviousBalance,
          sourceCurrentBalance: seedTransaction.sourceCurrentBalance,
          destinationPreviousBalance: seedTransaction.destinationPreviousBalance,
          destinationCurrentBalance: seedTransaction.destinationCurrentBalance,
        });

        const savedTransaction = await transactionRepository.save(transaction);

        if (seedTransaction.exchangeDetail) {
          const existingDetail = await exchangeDetailRepository.findOne({
            where: { transactionId: savedTransaction.id },
          });

          const exchangeDetail = exchangeDetailRepository.create({
            transactionId: savedTransaction.id,
            baseCurrency: seedTransaction.exchangeDetail.baseCurrency,
            quoteCurrency: seedTransaction.exchangeDetail.quoteCurrency,
            sourceAmount: seedTransaction.exchangeDetail.sourceAmount,
            rate: seedTransaction.exchangeDetail.rate,
            convertedAmount: seedTransaction.exchangeDetail.convertedAmount,
            effectiveAt: seedTransaction.exchangeDetail.effectiveAt,
          });

          if (existingDetail) {
            exchangeDetail.transactionId = existingDetail.transactionId;
          }

          await exchangeDetailRepository.save(exchangeDetail);
        }
      }
    });
  } finally {
    await AppDataSource.destroy();
  }
}

void seed();
