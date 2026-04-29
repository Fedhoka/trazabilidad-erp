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

  /**
   * Inventory analytics for the dashboard:
   * - stockByKind: stock value/units/lot count grouped by material kind.
   * - lowStock: 10 active materials with the least available quantity.
   * - expiringByDay: count of lots expiring per day for the next 30 days
   *   (data shape that's easy to feed into a heatmap or area chart).
   * - expiringBuckets: aggregated counts/values for 7/14/30-day windows.
   */
  async getInventoryAnalytics(tenantId: string) {
    type StockRow = { kind: string; value: string; lots: string; units: string };
    type LowRow = {
      id: string;
      code: string;
      name: string;
      kind: string;
      base_uom: string;
      available: string;
    };
    type ExpiryRow = { date: string; count: string; value: string };
    type BucketRow = {
      within_7: number;
      within_14: number;
      within_30: number;
      value_7: string;
      value_14: string;
      value_30: string;
    };

    const [stockByKindRows, lowStockRows, expiringByDayRows, bucketsRows] =
      await Promise.all([
        this.ds.query<StockRow[]>(
          `
          SELECT
            m.kind                                              AS kind,
            COALESCE(SUM(ml.quantity * ml.unit_cost), 0)::text  AS value,
            COUNT(*)::text                                      AS lots,
            COALESCE(SUM(ml.quantity), 0)::text                 AS units
          FROM material_lots ml
          JOIN materials m ON m.id = ml.material_id
          WHERE ml.tenant_id = $1 AND ml.status = 'AVAILABLE'
          GROUP BY m.kind
          ORDER BY m.kind ASC;
          `,
          [tenantId],
        ),
        this.ds.query<LowRow[]>(
          `
          SELECT
            m.id,
            m.code,
            m.name,
            m.kind,
            m.base_uom,
            COALESCE(
              SUM(CASE WHEN ml.status = 'AVAILABLE' THEN ml.quantity ELSE 0 END),
              0
            )::text AS available
          FROM materials m
          LEFT JOIN material_lots ml
            ON ml.material_id = m.id AND ml.tenant_id = m.tenant_id
          WHERE m.tenant_id = $1 AND m.is_active = true
          GROUP BY m.id
          ORDER BY available ASC, m.name ASC
          LIMIT 10;
          `,
          [tenantId],
        ),
        this.ds.query<ExpiryRow[]>(
          `
          SELECT
            TO_CHAR(expires_on, 'YYYY-MM-DD')                  AS date,
            COUNT(*)::text                                     AS count,
            COALESCE(SUM(quantity * unit_cost), 0)::text       AS value
          FROM material_lots
          WHERE tenant_id = $1
            AND status IN ('AVAILABLE', 'QUARANTINE')
            AND expires_on IS NOT NULL
            AND expires_on >= CURRENT_DATE
            AND expires_on <= CURRENT_DATE + INTERVAL '30 days'
          GROUP BY expires_on
          ORDER BY expires_on ASC;
          `,
          [tenantId],
        ),
        this.ds.query<BucketRow[]>(
          `
          SELECT
            COALESCE(SUM(CASE
              WHEN expires_on <= CURRENT_DATE + INTERVAL '7 days' THEN 1
              ELSE 0 END), 0)::int AS within_7,
            COALESCE(SUM(CASE
              WHEN expires_on >  CURRENT_DATE + INTERVAL '7 days'
               AND expires_on <= CURRENT_DATE + INTERVAL '14 days' THEN 1
              ELSE 0 END), 0)::int AS within_14,
            COALESCE(SUM(CASE
              WHEN expires_on >  CURRENT_DATE + INTERVAL '14 days'
               AND expires_on <= CURRENT_DATE + INTERVAL '30 days' THEN 1
              ELSE 0 END), 0)::int AS within_30,
            COALESCE(SUM(CASE
              WHEN expires_on <= CURRENT_DATE + INTERVAL '7 days'
              THEN quantity * unit_cost ELSE 0 END), 0)::text AS value_7,
            COALESCE(SUM(CASE
              WHEN expires_on >  CURRENT_DATE + INTERVAL '7 days'
               AND expires_on <= CURRENT_DATE + INTERVAL '14 days'
              THEN quantity * unit_cost ELSE 0 END), 0)::text AS value_14,
            COALESCE(SUM(CASE
              WHEN expires_on >  CURRENT_DATE + INTERVAL '14 days'
               AND expires_on <= CURRENT_DATE + INTERVAL '30 days'
              THEN quantity * unit_cost ELSE 0 END), 0)::text AS value_30
          FROM material_lots
          WHERE tenant_id = $1
            AND status IN ('AVAILABLE', 'QUARANTINE')
            AND expires_on IS NOT NULL
            AND expires_on >= CURRENT_DATE;
          `,
          [tenantId],
        ),
      ]);

    return {
      stockByKind: stockByKindRows.map((r) => ({
        kind: r.kind,
        value: Number(r.value),
        lots: Number(r.lots),
        units: Number(r.units),
      })),
      lowStock: lowStockRows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        kind: r.kind,
        baseUom: r.base_uom,
        available: Number(r.available),
      })),
      expiringByDay: expiringByDayRows.map((r) => ({
        date: r.date,
        count: Number(r.count),
        value: Number(r.value),
      })),
      expiringBuckets: {
        within7: bucketsRows[0]?.within_7 ?? 0,
        within14: bucketsRows[0]?.within_14 ?? 0,
        within30: bucketsRows[0]?.within_30 ?? 0,
        value7: Number(bucketsRows[0]?.value_7 ?? 0),
        value14: Number(bucketsRows[0]?.value_14 ?? 0),
        value30: Number(bucketsRows[0]?.value_30 ?? 0),
      },
    };
  }

  /**
   * Sales analytics for the dashboard:
   * - topCustomers: top 5 by net revenue in the last 12 months.
   * - topProducts: top 5 sold products (units + revenue) in the last 12
   *   months, joined through sales_orders since invoice_lines is free-text.
   * - byCondicionIva: customer count + invoice count + revenue grouped by
   *   AFIP condition.
   * - averageTicket: total / invoice_count for the same window.
   */
  async getSalesAnalytics(tenantId: string) {
    type CustomerRow = {
      id: string;
      name: string;
      condicion_iva: string;
      revenue: string;
      invoice_count: string;
    };
    type ProductRow = {
      id: string;
      code: string;
      name: string;
      units: string;
      revenue: string;
    };
    type CondicionRow = {
      condicion_iva: string;
      customers: string;
      revenue: string;
      invoice_count: string;
    };
    type TicketRow = {
      total_revenue: string;
      invoice_count: string;
      avg_ticket: string;
    };

    const [topCustomersRows, topProductsRows, condicionRows, ticketRows] =
      await Promise.all([
        this.ds.query<CustomerRow[]>(
          `
          SELECT
            c.id,
            c.name,
            c.condicion_iva,
            COALESCE(SUM(i.net_amount), 0)::text  AS revenue,
            COUNT(DISTINCT i.id)::text            AS invoice_count
          FROM invoices i
          JOIN customers c ON c.id = i.customer_id
          WHERE i.tenant_id = $1
            AND i.status = 'AUTHORIZED'
            AND COALESCE(i.issued_at, i.created_at) >= NOW() - INTERVAL '12 months'
          GROUP BY c.id
          ORDER BY revenue DESC
          LIMIT 5;
          `,
          [tenantId],
        ),
        this.ds.query<ProductRow[]>(
          `
          SELECT
            m.id,
            m.code,
            m.name,
            COALESCE(SUM(sol.quantity), 0)::text                AS units,
            COALESCE(SUM(sol.quantity * sol.unit_price), 0)::text AS revenue
          FROM invoices i
          JOIN sales_orders so ON so.id = i.sales_order_id
          JOIN sales_order_lines sol ON sol.sales_order_id = so.id
          JOIN materials m ON m.id = sol.material_id
          WHERE i.tenant_id = $1
            AND i.status = 'AUTHORIZED'
            AND COALESCE(i.issued_at, i.created_at) >= NOW() - INTERVAL '12 months'
          GROUP BY m.id
          ORDER BY revenue DESC
          LIMIT 5;
          `,
          [tenantId],
        ),
        this.ds.query<CondicionRow[]>(
          `
          SELECT
            c.condicion_iva                            AS condicion_iva,
            COUNT(DISTINCT c.id)::text                 AS customers,
            COALESCE(SUM(i.net_amount), 0)::text       AS revenue,
            COUNT(i.id)::text                          AS invoice_count
          FROM customers c
          LEFT JOIN invoices i
            ON i.customer_id = c.id
           AND i.tenant_id = c.tenant_id
           AND i.status = 'AUTHORIZED'
           AND COALESCE(i.issued_at, i.created_at) >= NOW() - INTERVAL '12 months'
          WHERE c.tenant_id = $1
          GROUP BY c.condicion_iva
          ORDER BY revenue DESC;
          `,
          [tenantId],
        ),
        this.ds.query<TicketRow[]>(
          `
          SELECT
            COALESCE(SUM(net_amount), 0)::text  AS total_revenue,
            COUNT(*)::text                      AS invoice_count,
            COALESCE(AVG(net_amount), 0)::text  AS avg_ticket
          FROM invoices
          WHERE tenant_id = $1
            AND status = 'AUTHORIZED'
            AND COALESCE(issued_at, created_at) >= NOW() - INTERVAL '12 months';
          `,
          [tenantId],
        ),
      ]);

    return {
      topCustomers: topCustomersRows.map((r) => ({
        id: r.id,
        name: r.name,
        condicionIva: r.condicion_iva,
        revenue: Number(r.revenue),
        invoiceCount: Number(r.invoice_count),
      })),
      topProducts: topProductsRows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        units: Number(r.units),
        revenue: Number(r.revenue),
      })),
      byCondicionIva: condicionRows.map((r) => ({
        condicionIva: r.condicion_iva,
        customers: Number(r.customers),
        revenue: Number(r.revenue),
        invoiceCount: Number(r.invoice_count),
      })),
      ticket: {
        totalRevenue: Number(ticketRows[0]?.total_revenue ?? 0),
        invoiceCount: Number(ticketRows[0]?.invoice_count ?? 0),
        average: Number(ticketRows[0]?.avg_ticket ?? 0),
      },
    };
  }
}
