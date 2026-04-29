'use client';

import { useState } from 'react';
import { Receipt, TrendingDown, TrendingUp, Wallet, Percent } from 'lucide-react';
import { useDashboardStats } from '@/hooks/use-dashboard';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { MetricCard } from '@/components/dashboard/metric-card';
import { RevenueAreaChart } from '@/components/dashboard/revenue-chart';
import { ProductionBarChart } from '@/components/dashboard/production-chart';
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
    </>
  );
}
