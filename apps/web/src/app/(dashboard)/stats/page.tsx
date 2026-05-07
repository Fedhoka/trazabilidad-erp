'use client';

import { useState } from 'react';
import {
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
  Percent,
  Users,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';
import {
  useDashboardStats,
  useInventoryAnalytics,
  useSalesAnalytics,
} from '@/hooks/use-dashboard';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { MetricCard } from '@/components/dashboard/metric-card';
import { RevenueAreaChart } from '@/components/dashboard/revenue-chart';
import { ProductionBarChart } from '@/components/dashboard/production-chart';
import { StockByKindChart } from '@/components/dashboard/stock-by-kind-chart';
import { LowStockTable } from '@/components/dashboard/low-stock-table';
import { ExpiringTimelineChart } from '@/components/dashboard/expiring-timeline';
import { TopList, buildTopListItems } from '@/components/dashboard/top-list';
import { CondicionIvaBreakdown } from '@/components/dashboard/condicion-iva-breakdown';
import { SalesMixCard } from '@/components/dashboard/sales-mix-card';
import {
  PAYMENT_METHOD_LABELS,
  INVOICE_TYPE_LABELS,
  type PaymentMethod,
  type InvoiceType,
} from '@/hooks/use-fiscal';
import { formatNumber as fmtNum } from '@/lib/format';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  percentDelta,
} from '@/lib/format';
import { cn } from '@/lib/utils';

const WINDOWS = [
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
  { value: 24, label: '24 meses' },
] as const;

export default function StatsPage() {
  const [window, setWindow] = useState<number>(12);
  const { data, isLoading } = useDashboardStats(window);
  const { data: inventory, isLoading: inventoryLoading } = useInventoryAnalytics();
  const { data: sales, isLoading: salesLoading } = useSalesAnalytics();

  // Month-over-month deltas computed against the second-to-last point.
  const last = data?.months[data.months.length - 1];
  const prev = data?.months[data.months.length - 2];

  const revenueDelta = percentDelta(last?.revenue, prev?.revenue);
  const costsDelta = percentDelta(last?.costs, prev?.costs);
  const marginDelta = percentDelta(last?.margin, prev?.margin);
  const unitsDelta = percentDelta(last?.unitsProduced, prev?.unitsProduced);

  return (
    <>
      <PageHeader
        title="Estadísticas"
        description={`Desempeño comercial y operativo de los últimos ${window} meses`}
        actions={
          <div
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1"
            role="tablist"
            aria-label="Ventana de análisis"
          >
            {WINDOWS.map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={window === value ? 'default' : 'ghost'}
                onClick={() => setWindow(value)}
                role="tab"
                aria-selected={window === value}
                className={cn(
                  'h-7 px-3 text-xs',
                  window === value && 'shadow-none',
                )}
              >
                {label}
              </Button>
            ))}
          </div>
        }
      />

      {/* ── KPI strip with month-over-month deltas ───────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Facturación del mes"
          value={formatCurrency(last?.revenue ?? 0)}
          delta={revenueDelta}
          icon={Wallet}
          loading={isLoading}
        />
        <MetricCard
          label="Costos del mes"
          value={formatCurrency(last?.costs ?? 0)}
          delta={costsDelta}
          invertColors
          icon={TrendingDown}
          loading={isLoading}
        />
        <MetricCard
          label="Margen del mes"
          value={formatCurrency(last?.margin ?? 0)}
          delta={marginDelta}
          icon={TrendingUp}
          loading={isLoading}
        />
        <MetricCard
          label="Unidades producidas"
          value={formatNumber(last?.unitsProduced ?? 0, { maximumFractionDigits: 0 })}
          delta={unitsDelta}
          icon={Receipt}
          loading={isLoading}
        />
      </section>

      {/* ── Window summary ───────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={`Facturado (${window}m)`}
          value={formatCurrency(data?.totals.revenue ?? 0)}
          icon={Wallet}
          loading={isLoading}
        />
        <MetricCard
          label={`Costos producción (${window}m)`}
          value={formatCurrency(data?.totals.costs ?? 0)}
          icon={TrendingDown}
          loading={isLoading}
        />
        <MetricCard
          label={`Margen acumulado (${window}m)`}
          value={formatCurrency(data?.totals.margin ?? 0)}
          icon={TrendingUp}
          loading={isLoading}
        />
        <MetricCard
          label="Margen %"
          value={formatPercent(data?.marginPercent ?? 0)}
          icon={Percent}
          loading={isLoading}
        />
      </section>

      {/* ── Charts ────────────────────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <RevenueAreaChart data={data?.months} loading={isLoading} />
        <ProductionBarChart data={data?.months} loading={isLoading} />
      </section>

      {/* ── Inventory analytics ──────────────────────────────────── */}
      <section className="space-y-3 pt-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Inventario</h2>
          <p className="text-sm text-muted-foreground">
            Capital inmovilizado, alertas de bajo stock y vencimientos próximos
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <StockByKindChart
            data={inventory?.stockByKind}
            loading={inventoryLoading}
          />
          <LowStockTable
            data={inventory?.lowStock}
            loading={inventoryLoading}
          />
        </div>
        <div className="grid gap-4">
          <ExpiringTimelineChart
            data={inventory?.expiringByDay}
            buckets={inventory?.expiringBuckets}
            loading={inventoryLoading}
          />
        </div>
      </section>

      {/* ── Commercial analytics ─────────────────────────────────── */}
      <section className="space-y-3 pt-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Comercial</h2>
          <p className="text-sm text-muted-foreground">
            Ranking de clientes y productos, ticket promedio y mix por condición
            IVA — últimos 12 meses
          </p>
        </div>

        {/* Ticket strip */}
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Ticket promedio"
            value={
              sales
                ? formatCurrency(sales.ticket.average)
                : formatCurrency(0)
            }
            icon={CreditCard}
            loading={salesLoading}
          />
          <MetricCard
            label="Facturas emitidas"
            value={fmtNum(sales?.ticket.invoiceCount ?? 0)}
            icon={Receipt}
            loading={salesLoading}
          />
          <MetricCard
            label="Total facturado"
            value={formatCurrency(sales?.ticket.totalRevenue ?? 0)}
            icon={Wallet}
            loading={salesLoading}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TopList
            title="Top clientes"
            description="Clientes con mayor facturación neta"
            items={buildTopListItems(
              sales?.topCustomers,
              (c) => c.name,
              (c) => `${c.invoiceCount} facturas`,
              (c) => c.id,
            )}
            loading={salesLoading}
          />
          <TopList
            title="Top productos"
            description="Productos más vendidos por facturación"
            items={buildTopListItems(
              sales?.topProducts,
              (p) => p.name,
              (p) => `${p.code} · ${fmtNum(p.units, { maximumFractionDigits: 2 })} u`,
              (p) => p.id,
            )}
            loading={salesLoading}
          />
        </div>

        <div className="grid gap-4">
          <CondicionIvaBreakdown
            data={sales?.byCondicionIva}
            loading={salesLoading}
          />
        </div>

        {/* ── Invoice type + payment method mix ──────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <SalesMixCard
            title="Tipo de comprobante"
            description="Facturación dividida por A / B / C — últimos 12 meses"
            colorMap={INVOICE_TYPE_COLORS}
            data={(sales?.byInvoiceType ?? []).map((d) => ({
              key: d.invoiceType,
              label: INVOICE_TYPE_LABELS[d.invoiceType as InvoiceType] ?? d.invoiceType,
              revenue: d.revenue,
              invoiceCount: d.invoiceCount,
            }))}
            loading={salesLoading}
          />
          <SalesMixCard
            title="Método de pago"
            description="Cómo cobraste — facturación por método en los últimos 12 meses"
            colorMap={PAYMENT_METHOD_COLORS}
            data={(sales?.byPaymentMethod ?? []).map((d) => ({
              key: d.paymentMethod,
              label:
                PAYMENT_METHOD_LABELS[d.paymentMethod as PaymentMethod] ??
                d.paymentMethod,
              revenue: d.revenue,
              invoiceCount: d.invoiceCount,
            }))}
            loading={salesLoading}
          />
        </div>
      </section>
    </>
  );
}

// Color slots for the new mix cards. Picked so each value gets a stable
// colour across renders (no Recharts auto-rotation surprises).
const INVOICE_TYPE_COLORS: Record<string, string> = {
  A: 'var(--chart-1)', // terracotta
  B: 'var(--chart-3)', // mustard
  C: 'var(--chart-5)', // slate-blue
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CASH: 'var(--chart-1)',
  BANK_TRANSFER: 'var(--chart-3)',
  DEBIT_CARD: 'var(--chart-4)',
  CREDIT_CARD: 'var(--chart-5)',
  MERCADOPAGO: 'var(--chart-6)',
  CHECK: 'var(--chart-2)',
  CURRENT_ACCOUNT: 'var(--info)',
  OTHER: 'var(--muted-foreground)',
};
