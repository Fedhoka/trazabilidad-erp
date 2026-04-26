import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';

/**
 * Redis is treated as non-critical: its status is reported but a failure
 * does NOT cause the overall /health response to return 503.
 * (The app still works without Redis — token blacklisting is simply skipped.)
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isUp = await this.redis.ping();
    // Intentionally not throwing HealthCheckError — Redis is degraded, not fatal.
    return this.getStatus(key, isUp);
  }
}
