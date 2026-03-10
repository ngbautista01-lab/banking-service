import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { AccountEntity } from '../../modules/accounts/domain/account.entity';
import { ClientEntity } from '../../modules/clients/domain/client.entity';
import { TransactionEntity } from '../../modules/transactions/domain/transaction.entity';

type IndexedClient = Pick<
  ClientEntity,
  'id' | 'firstName' | 'lastName' | 'email' | 'documentNumber' | 'phone' | 'status'
>;

type IndexedAccount = Pick<
  AccountEntity,
  'id' | 'clientId' | 'accountNumber' | 'alias' | 'currency' | 'balance' | 'status'
>;

type IndexedTransaction = Pick<
  TransactionEntity,
  | 'id'
  | 'sourceAccountId'
  | 'destinationAccountId'
  | 'type'
  | 'channel'
  | 'currency'
  | 'amount'
  | 'reference'
  | 'description'
  | 'status'
>;

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly clientIndexName = 'clients';
  private readonly accountIndexName = 'accounts';
  private readonly transactionIndexName = 'transactions';
  private readonly client?: Client;

  constructor() {
    const node = process.env.ELASTICSEARCH_NODE;
    if (node) {
      this.client = new Client({ node });
    }
  }

  async indexClient(entry: IndexedClient): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.index({
        index: this.clientIndexName,
        id: entry.id,
        document: entry,
        refresh: 'wait_for',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown search error';
      this.logger.warn(`Unable to index client ${entry.id}: ${message}`);
    }
  }

  async removeClient(id: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.delete({
        index: this.clientIndexName,
        id,
        refresh: 'wait_for',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown search error';
      this.logger.warn(`Unable to delete client ${id} from index: ${message}`);
    }
  }

  async searchClients(term: string): Promise<string[]> {
    if (!this.client) {
      return [];
    }

    try {
      const response = await this.client.search<IndexedClient>({
        index: this.clientIndexName,
        query: {
          multi_match: {
            query: term,
            fields: ['firstName', 'lastName', 'email^2', 'documentNumber^2', 'phone^2', 'status'],
          },
        },
      });

      return response.hits.hits
        .map((hit) => hit._source?.id)
        .filter((value): value is string => Boolean(value));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown search error';
      this.logger.warn(`Search unavailable, falling back to database query: ${message}`);
      return [];
    }
  }

  async indexAccount(entry: IndexedAccount): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.index({
        index: this.accountIndexName,
        id: entry.id,
        document: entry,
        refresh: 'wait_for',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown search error';
      this.logger.warn(`Unable to index account ${entry.id}: ${message}`);
    }
  }

  async removeAccount(id: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.delete({
        index: this.accountIndexName,
        id,
        refresh: 'wait_for',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown search error';
      this.logger.warn(`Unable to delete account ${id} from index: ${message}`);
    }
  }

  async searchAccounts(term: string): Promise<string[]> {
    if (!this.client) {
      return [];
    }

    try {
      const response = await this.client.search<IndexedAccount>({
        index: this.accountIndexName,
        query: {
          multi_match: {
            query: term,
            fields: ['accountNumber^2', 'alias', 'clientId', 'currency', 'status'],
          },
        },
      });

      return response.hits.hits
        .map((hit) => hit._source?.id)
        .filter((value): value is string => Boolean(value));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown search error';
      this.logger.warn(`Account search unavailable, falling back to database query: ${message}`);
      return [];
    }
  }

  async indexTransaction(entry: IndexedTransaction): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.index({
        index: this.transactionIndexName,
        id: entry.id,
        document: entry,
        refresh: 'wait_for',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown search error';
      this.logger.warn(`Unable to index transaction ${entry.id}: ${message}`);
    }
  }

  async removeTransaction(id: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.delete({
        index: this.transactionIndexName,
        id,
        refresh: 'wait_for',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown search error';
      this.logger.warn(`Unable to delete transaction ${id} from index: ${message}`);
    }
  }

  async searchTransactions(term: string): Promise<string[]> {
    if (!this.client) {
      return [];
    }

    try {
      const response = await this.client.search<IndexedTransaction>({
        index: this.transactionIndexName,
        query: {
          multi_match: {
            query: term,
            fields: [
              'reference^2',
              'description',
              'sourceAccountId',
              'destinationAccountId',
              'type',
              'channel',
              'currency',
              'status',
            ],
          },
        },
      });

      return response.hits.hits
        .map((hit) => hit._source?.id)
        .filter((value): value is string => Boolean(value));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown search error';
      this.logger.warn(`Transaction search unavailable, falling back to database query: ${message}`);
      return [];
    }
  }
}
