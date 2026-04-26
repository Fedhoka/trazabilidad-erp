import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private readonly ds: DataSource) {}

  async getKpis(tenantId: string) {
    const rows = await this.ds.query<Record<string, string>[]>(
      `SELECT
        (SELECT COUNT(*)
           FROM material_lots
          WHERE tenant_id = $1 AND status = 'AVAILABLE') AS available_lots,

        (SELECT COALESCE(SUM(quantity * unit_cost), 0)
           FROM material_lots
          WHERE tenant_id = $1 AND status = 'AVAILABLE') AS stock_value,

        (SELECT COUNT(*)
           FROM purchase_orders
          WHERE tenant_id = $1 AND status IN ('DRAFT', 'APPROVED')) AS pending_pos,

        (SELECT COUNT(*)
           FROM sales_orders
          WHERE tenant_id = $1 AND status IN ('DRAFT', 'CONFIRMED')) AS open_sales_orders,

        (SELECT COUNT(*)
           FROM production_orders
          WHERE tenant_id = $1 AND status = 'IN_PROGRESS') AS in_progress_orders,

        (SELECT COUNT(*)
           FROM invoices
          WHERE tenant_id = $1
            AND status = 'AUTHORIZED'
            AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) AS month_invoice_count,

        (SELECT COALESCE(SUM(total_amount), 0)
           FROM invoices
          WHERE tenant_id = $1
            AND status = 'AUTHORIZED'
            AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) AS month_invoice_total`,
      [tenantId],
    );

    const r = rows[0];
    return {
      availableLots: Number(r.available_lots),
      stockValue: Number(r.stock_value),
      pendingPos: Number(r.pending_pos),
      openSalesOrders: Number(r.open_sales_orders),
      inProgressOrders: Number(r.in_progress_orders),
      monthInvoiceCount: Number(r.month_invoice_count),
      monthInvoiceTotal: Number(r.month_invoice_total),
    };
  }
}
