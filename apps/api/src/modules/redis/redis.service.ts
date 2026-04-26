import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private available = false;

  constructor(config: ConfigService) {
    this.client = new Redis({
      host: config.get<string>('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6379),
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    this.client.on('connect', () => {
      this.available = true;
      this.logger.log('Redis connected');
    });
    this.client.on('error', (err: Error) => {
      if (this.available) this.logger.warn(`Redis error: ${err.message}`);
      this.available = false;
    });

    // Connect in background; if Redis is absent, errors are suppressed above
    this.client.connect().catch(() => undefined);
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.available) return;
    await this.client.set(key, value, 'EX', ttlSeconds).catch(() => undefined);
  }

  async get(key: string): Promise<string | null> {
    if (!this.available) return null;
    return this.client.get(key).catch(() => null);
  }

  async del(key: string): Promise<void> {
    if (!this.available) return;
    await this.client.del(key).catch(() => undefined);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.available) return false;
    return (await this.client.exists(key).catch(() => 0)) > 0;
  }

  /** Used by HealthModule — resolves to true only when Redis responds to PING. */
  async ping(): Promise<boolean> {
    if (!this.available) return false;
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}
