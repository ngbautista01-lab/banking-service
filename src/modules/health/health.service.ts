import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { SearchService } from '../../infrastructure/search/search.service';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
    private readonly searchService: SearchService,
  ) {}

  async getHealth() {
    const database = await this.databaseStatus();
    const search = await this.searchService.healthCheck();

    return {
      service: 'banking-service',
      status:
        database === 'up' && search !== 'down' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies: {
        database,
        cache: this.cacheService.getStatus(),
        search,
      },
    };
  }

  private async databaseStatus(): Promise<'up' | 'down'> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    }
  }
}
