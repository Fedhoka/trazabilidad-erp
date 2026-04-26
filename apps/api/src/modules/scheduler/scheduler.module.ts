import { Module } from '@nestjs/common';
import { LotExpiryService } from './lot-expiry.service';

@Module({
  providers: [LotExpiryService],
})
export class SchedulerModule {}
