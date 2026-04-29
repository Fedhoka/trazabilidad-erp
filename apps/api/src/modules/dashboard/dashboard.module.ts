import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { FixedCostsModule } from '../fixed-costs/fixed-costs.module';

@Module({
  imports: [FixedCostsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
