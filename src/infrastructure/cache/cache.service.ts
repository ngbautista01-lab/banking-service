import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly fallbackStore = new Map<string, string>();
  private readonly redis?: Redis;

  constructor() {
    const host = process.env.REDIS_HOST;
    if (host) {
      this.redis = new Redis({
        host,
        port: Number(process.env.REDIS_PORT ?? 6379),
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });

      void this.redis.connect().catch((error: Error) => {
        this.logger.warn(`Redis unavailable, using in-memory cache: ${error.message}`);
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis?.status === 'ready') {
      const value = await this.redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    }

    const fallback = this.fallbackStore.get(key);
    return fallback ? (JSON.parse(fallback) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    const payload = JSON.stringify(value);

    if (this.redis?.status === 'ready') {
      await this.redis.set(key, payload, 'EX', ttlSeconds);
      return;
    }

    this.fallbackStore.set(key, payload);
  }

  async del(key: string): Promise<void> {
    if (this.redis?.status === 'ready') {
      await this.redis.del(key);
      return;
    }

    this.fallbackStore.delete(key);
  }

  getStatus(): 'redis' | 'memory' {
    return this.redis?.status === 'ready' ? 'redis' : 'memory';
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis?.quit();
  }
}
