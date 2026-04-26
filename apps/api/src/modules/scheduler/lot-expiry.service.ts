import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class LotExpiryService {
  private readonly logger = new Logger(LotExpiryService.name);

  constructor(private readonly ds: DataSource) {}

  /** Runs every hour — marks AVAILABLE / QUARANTINE lots whose expires_on has passed as EXPIRED. */
  @Cron(CronExpression.EVERY_HOUR)
  async expireLots() {
    const result = await this.ds.query<{ count: string }[]>(
      `UPDATE material_lots
          SET status     = 'EXPIRED',
              updated_at = NOW()
        WHERE status  IN ('AVAILABLE', 'QUARANTINE')
          AND expires_on IS NOT NULL
          AND expires_on < NOW()
       RETURNING id`,
    );
    if (result.length > 0) {
      this.logger.log(`Auto-expired ${result.length} lot(s).`);
    }
  }
}
