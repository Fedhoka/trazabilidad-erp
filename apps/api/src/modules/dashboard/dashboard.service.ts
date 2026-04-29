import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface MonthlyStatPoint {
  /** ISO YYYY-MM, e.g. "2026-04". */
  month: string;
  /** Sum of net_amount of authorized invoices issued in that month. */
  revenue: number;
  /** Count of authorized invoices issued in that month. */
  invoiceCount: number;
  /** Sum of actual_cost of production orders completed in that month. */
  costs: number;
  /** Sum of actual_qty of production orders completed in that month. */
  unitsProduced: number;
  /** Sum of received purchase order line totals (qty * unit_price) in that month. */
  purchases: number;
  /** revenue - costs (gross margin against direct production costs). */
  margin: number;
}

export interface DashboardStats {
  months: MonthlyStatPoint[];
  totals: {
    revenue: number;
    costs: number;
    margin: number;
    invoiceCount: number;
    unitsProduced: number;
    purchases: number;
  };
  /** Margin / revenue * 100, or 0 if revenue is 0. */
  marginPercent: number;
}

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
            AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) AS month_invoice_total,

        (SELECT COUNT(*)
           FROM material_lots
          WHERE tenant_id = $1
            AND status IN ('AVAILABLE', 'QUARANTINE')
            AND expires_on IS NOT NULL
            AND expires_on >= NOW()
            AND expires_on <= NOW() + INTERVAL '7 days') AS expiring_soon`,
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
      expiringSoon: Number(r.expiring_soon),
    };
  }

  /**
   * Returns a rolling N-month time series (default 12) of revenue, production
   * costs, units produced, purchases and computed margin. Months with no data
   * are still present in the response (filled with zeros) so charts can render
   * a complete X axis.
   */
  async getStats(tenantId: string, months = 12): Promise<DashboardStats> {
    type Row = {
      month: string;
      revenue: string;
      invoice_count: string;
      costs: string;
      units_produced: string;
      purchases: string;
    };

    const rows = await this.ds.query<Row[]>(
      `
      WITH calendar AS (
        SELECT generate_series(
          DATE_TRUNC('month', NOW()) - ($2::int - 1) * INTERVAL '1 month',
          DATE_TRUNC('month', NOW()),
          INTERVAL '1 month'
        )::DATE AS month_start
      ),
      revenue AS (
        SELECT
          DATE_TRUNC('month', COALESCE(issued_at, created_at))::DATE AS m,
          SUM(net_amount)::numeric AS revenue,
          COUNT(*)::int           AS invoice_count
        FROM invoices
        WHERE tenant_id = $1
          AND status = 'AUTHORIZED'
        GROUP BY 1
      ),
      production AS (
        SELECT
          DATE_TRUNC('month', COALESCE(completed_at, updated_at))::DATE AS m,
          SUM(COALESCE(actual_cost, 0))::numeric AS costs,
          SUM(COALESCE(actual_qty, 0))::numeric  AS units_produced
        FROM production_orders
        WHERE tenant_id = $1
          AND status = 'COMPLETED'
        GROUP BY 1
      ),
      purchases AS (
        SELECT
          DATE_TRUNC('month', po.updated_at)::DATE AS m,
          SUM(pol.quantity * pol.unit_price)::numeric AS purchases
        FROM purchase_orders po
        JOIN purchase_order_lines pol ON pol.purchase_order_id = po.id
        WHERE po.tenant_id = $1
          AND po.status IN ('RECEIVED', 'CLOSED')
        GROUP BY 1
      )
      SELECT
        TO_CHAR(c.month_start, 'YYYY-MM')                AS month,
        COALESCE(r.revenue, 0)::text                     AS revenue,
        COALESCE(r.invoice_count, 0)::text               AS invoice_count,
        COALESCE(p.costs, 0)::text                       AS costs,
        COALESCE(p.units_produced, 0)::text              AS units_produced,
        COALESCE(pu.purchases, 0)::text                  AS purchases
      FROM calendar c
      LEFT JOIN revenue   r  ON r.m  = c.month_start
      LEFT JOIN production p ON p.m  = c.month_start
      LEFT JOIN purchases  pu ON pu.m = c.month_start
      ORDER BY c.month_start ASC;
      `,
      [tenantId, months],
    );

    const points: MonthlyStatPoint[] = rows.map((r) => {
      const revenue = Number(r.revenue);
      const costs = Number(r.costs);
      return {
        month: r.month,
        revenue,
        invoiceCount: Number(r.invoice_count),
        costs,
        unitsProduced: Number(r.units_produced),
        purchases: Number(r.purchases),
        margin: revenue - costs,
      };
    });

    // Aggregate totals over the window.
    const totals = points.reduce(
      (acc, p) => {
        acc.revenue += p.revenue;
        acc.costs += p.costs;
        acc.margin += p.margin;
        acc.invoiceCount += p.invoiceCount;
        acc.unitsProduced += p.unitsProduced;
        acc.purchases += p.purchases;
        return acc;
      },
      {
        revenue: 0,
        costs: 0,
        margin: 0,
        invoiceCount: 0,
        unitsProduced: 0,
        purchases: 0,
      },
    );

    const marginPercent =
      totals.revenue > 0 ? (totals.margin / totals.revenue) * 100 : 0;

    return { months: points, totals, marginPercent };
  }
}
