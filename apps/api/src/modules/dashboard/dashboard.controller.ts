import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { StatsQueryDto } from './dto/stats-query.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('kpis')
  getKpis(@CurrentUser() user: User) {
    return this.service.getKpis(user.tenantId);
  }

  /**
   * Time-series stats for charts: revenue, costs, units produced, margin
   * grouped by month. Returns N months ending in the current month.
   */
  @Get('stats')
  getStats(@CurrentUser() user: User, @Query() query: StatsQueryDto) {
    return this.service.getStats(user.tenantId, query.months ?? 12);
  }

  /**
   * Inventory analytics: stock value by kind, lowest-stock materials,
   * and expiring lots breakdown for the next 30 days.
   */
  @Get('inventory-analytics')
  getInventoryAnalytics(@CurrentUser() user: User) {
    return this.service.getInventoryAnalytics(user.tenantId);
  }

  /**
   * Sales analytics: top customers/products, condicion IVA breakdown, and
   * average ticket — all over a rolling 12-month window.
   */
  @Get('sales-analytics')
  getSalesAnalytics(@CurrentUser() user: User) {
    return this.service.getSalesAnalytics(user.tenantId);
  }
}
