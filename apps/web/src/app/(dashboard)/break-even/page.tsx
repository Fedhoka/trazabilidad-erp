'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Link from 'next/link';
import {
  ArrowRight,
  Calculator,
  DollarSign,
  Package,
  Scale,
  TrendingUp,
} from 'lucide-react';
import { useBreakEven } from '@/hooks/use-dashboard';
import { PageHeader } from '@/components/layout/page-header';
import { MetricCard } from '@/components/dashboard/metric-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  formatPercent,
} from '@/lib/format';

interface ChartPoint {
  units: number;
  revenue: number;
  totalCost: number;
}

/** Build sample points from 0 to 2 * break-even units for the chart. */
function buildChartData(
  fixedCosts: number,
  pricePerUnit: number,
  costPerUnit: number,
  breakEvenUnits: number,
): ChartPoint[] {
  const maxUnits = Math.max(breakEvenUnits * 2, 10);
  const points: ChartPoint[] = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const units = (maxUnits / steps) * i;
    points.push({
      units,
      revenue: units * pricePerUnit,
      totalCost: fixedCosts + units * costPerUnit,
    });
  }
  return points;
}

interface ChartTooltipPayload {
  payload: ChartPoint;
  value: number;
  dataKey: string;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: number;
}) {
  if (!active || !payload?.length || label === undefined) return null;
  const point = payload[0]!.payload;
  const margin = point.revenue - point.totalCost;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-elevated">
      <p className="mb-1.5 font-semibold text-foreground">
        {formatNumber(label, { maximumFractionDigits: 0 })} unidades
      </p>
      <div className="space-y-0.5">
        <p className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Ingresos</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(point.revenue)}
          </span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Costos totales</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(point.totalCost)}
          </span>
        </p>
        <p className="mt-1 flex items-center justify-between gap-4 border-t border-border/60 pt-1">
          <span className="text-muted-foreground">Resultado</span>
          <span
            className={cn(
              'font-mono font-medium',
              margin >= 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {formatCurrency(margin)}
          </span>
        </p>
      </div>
    </div>
  );
}

export default function BreakEvenPage() {
  const { data, isLoading } = useBreakEven(12);

  const hasMargin =
    data?.avgMarginPercent !== null &&
    data?.avgMarginPercent !== undefined &&
    data.avgMarginPercent > 0;
  const canBreakEven =
    !!data && data.breakEvenRevenue !== null && data.breakEvenUnits !== null;

  const chartData =
    canBreakEven && data.avgUnitPrice !== null && data.avgUnitCost !== null
      ? buildChartData(
          data.monthlyFixedCosts,
          data.avgUnitPrice,
          data.avgUnitCost,
          data.breakEvenUnits!,
        )
      : [];

  return (
    <>
      <PageHeader
        title="Punto de equilibrio"
        description="Análisis de cuántas ventas necesitás para cubrir costos fijos."
        actions={
          <Link href="/fixed-costs">
            <Button variant="outline" className="gap-2">
              <Calculator className="h-4 w-4" />
              Editar costos fijos
            </Button>
          </Link>
        }
      />

      {/* ── KPI strip ────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Costos fijos mensuales"
          value={formatCurrency(data?.monthlyFixedCosts ?? 0)}
          icon={Calculator}
          loading={isLoading}
        />
        <MetricCard
          label="Margen promedio"
          value={
            data?.avgMarginPercent !== null && data?.avgMarginPercent !== undefined
              ? formatPercent(data.avgMarginPercent)
              : '—'
          }
          icon={TrendingUp}
          loading={isLoading}
        />
        <MetricCard
          label="Break-even (facturación)"
          value={
            data?.breakEvenRevenue !== null && data?.breakEvenRevenue !== undefined
              ? formatCurrency(data.breakEvenRevenue)
              : '—'
          }
          icon={DollarSign}
          loading={isLoading}
        />
        <MetricCard
          label="Break-even (unidades)"
          value={
            data?.breakEvenUnits !== null && data?.breakEvenUnits !== undefined
              ? formatNumber(data.breakEvenUnits, { maximumFractionDigits: 0 })
              : '—'
          }
          icon={Package}
          loading={isLoading}
        />
      </section>

      {/* ── Coverage banner ──────────────────────────────────────── */}
      {data && (
        <CoverageBanner
          coverage={data.coverage}
          currentMonthlyRevenue={data.currentMonthlyRevenue}
          breakEvenRevenue={data.breakEvenRevenue}
        />
      )}

      {/* ── Chart ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Curva ingresos vs. costos totales</CardTitle>
          <CardDescription>
            La intersección marca el punto de equilibrio. Por debajo perdés;
            por encima, ganás.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[340px] w-full" />
          ) : !canBreakEven ? (
            <NoMarginEmptyState
              hasMargin={hasMargin}
              hasFixedCosts={(data?.monthlyFixedCosts ?? 0) > 0}
            />
          ) : (
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    type="number"
                    dataKey="units"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    tickFormatter={(v) =>
                      formatNumber(v, { maximumFractionDigits: 0 })
                    }
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: 'Unidades',
                      position: 'insideBottom',
                      offset: -2,
                      fill: 'var(--muted-foreground)',
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    tickFormatter={formatCurrencyCompact}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: 'var(--border)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    dot={false}
                    name="Ingresos"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalCost"
                    stroke="var(--chart-4)"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={false}
                    name="Costos totales"
                  />
                  {/* Break-even intersection marker */}
                  {data!.breakEvenUnits !== null &&
                    data!.breakEvenRevenue !== null && (
                      <ReferenceDot
                        x={data!.breakEvenUnits}
                        y={data!.breakEvenRevenue}
                        r={6}
                        fill="var(--primary)"
                        stroke="var(--background)"
                        strokeWidth={2}
                        ifOverflow="extendDomain"
                      />
                    )}
                </LineChart>
              </ResponsiveContainer>

              {/* Inline legend */}
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span
                    className="block h-0.5 w-6"
                    style={{ background: 'var(--chart-1)' }}
                    aria-hidden
                  />
                  Ingresos
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="block h-0.5 w-6 border-t-2 border-dashed"
                    style={{ borderColor: 'var(--chart-4)' }}
                    aria-hidden
                  />
                  Costos totales (fijos + variables)
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="block size-2 rounded-full"
                    style={{ background: 'var(--primary)' }}
                    aria-hidden
                  />
                  Punto de equilibrio
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Detail breakdown ─────────────────────────────────────── */}
      {data && canBreakEven && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle del cálculo</CardTitle>
            <CardDescription>Promedios derivados de los últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <DetailRow
                icon={Scale}
                label="Precio promedio / unidad"
                value={formatCurrency(data.avgUnitPrice ?? 0)}
              />
              <DetailRow
                icon={TrendingUp}
                label="Costo promedio / unidad"
                value={formatCurrency(data.avgUnitCost ?? 0)}
              />
              <DetailRow
                icon={ArrowRight}
                label="Contribución / unidad"
                value={formatCurrency(data.contributionPerUnit ?? 0)}
              />
              <DetailRow
                icon={Package}
                label="Unidades producidas (12m)"
                value={formatNumber(data.windowUnits, { maximumFractionDigits: 0 })}
              />
            </dl>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function CoverageBanner({
  coverage,
  currentMonthlyRevenue,
  breakEvenRevenue,
}: {
  coverage: number | null;
  currentMonthlyRevenue: number;
  breakEvenRevenue: number | null;
}) {
  if (coverage === null || breakEvenRevenue === null) return null;

  const isCovered = coverage >= 1;
  const tone = isCovered
    ? 'border-success/30 bg-success/5 text-success'
    : 'border-destructive/30 bg-destructive/5 text-destructive';
  const surplus = currentMonthlyRevenue - breakEvenRevenue;

  return (
    <div className={cn('rounded-lg border px-4 py-3 text-sm', tone)}>
      <p className="font-semibold">
        {isCovered
          ? `Estás ${formatPercent((coverage - 1) * 100)} por encima del break-even`
          : `Te faltan ${formatPercent((1 - coverage) * 100)} para llegar al break-even`}
      </p>
      <p className="mt-0.5 text-foreground/80">
        Facturación promedio actual:{' '}
        <span className="font-mono font-medium">
          {formatCurrency(currentMonthlyRevenue)}
        </span>{' '}
        · Necesitás{' '}
        <span className="font-mono font-medium">
          {formatCurrency(breakEvenRevenue)}
        </span>{' '}
        ·{' '}
        <span className="font-mono font-medium">
          {surplus >= 0 ? '+' : ''}
          {formatCurrency(surplus)}
        </span>{' '}
        de diferencia
      </p>
    </div>
  );
}

function NoMarginEmptyState({
  hasMargin,
  hasFixedCosts,
}: {
  hasMargin: boolean;
  hasFixedCosts: boolean;
}) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center gap-3 text-center">
      <Scale className="size-10 text-muted-foreground/40" aria-hidden />
      <div className="max-w-md space-y-1">
        <p className="text-sm font-medium text-foreground">
          {!hasFixedCosts
            ? 'Cargá tus costos fijos primero'
            : !hasMargin
            ? 'Necesitamos un margen positivo para calcular el break-even'
            : 'Sin datos suficientes'}
        </p>
        <p className="text-xs text-muted-foreground">
          {!hasFixedCosts
            ? 'Sin costos fijos no hay break-even que calcular.'
            : !hasMargin
            ? 'Si el costo promedio iguala o supera al precio promedio, vendés con margen 0 o negativo. Subí precios o reducí costos por unidad.'
            : 'Generá facturas autorizadas y completá órdenes de producción para ver el cálculo.'}
        </p>
      </div>
      {!hasFixedCosts && (
        <Link href="/fixed-costs">
          <Button size="sm" className="mt-1">
            Cargar costos fijos
          </Button>
        </Link>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-mono text-base font-semibold tabular-nums">
          {value}
        </dd>
      </div>
    </div>
  );
}
