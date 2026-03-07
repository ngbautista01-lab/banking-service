import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { ClientEntity } from '../../modules/clients/domain/client.entity';

type IndexedClient = Pick<
  ClientEntity,
  'id' | 'firstName' | 'lastName' | 'email' | 'documentNumber' | 'phone' | 'status'
>;

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly indexName = 'clients';
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
        index: this.indexName,
        id: entry.id,
        document: entry,
        refresh: 'wait_for',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown search error';
      this.logger.warn(`Unable to index client ${entry.id}: ${message}`);
    }
  }

  async searchClients(term: string): Promise<string[]> {
    if (!this.client) {
      return [];
    }

    try {
      const response = await this.client.search<IndexedClient>({
        index: this.indexName,
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
}
