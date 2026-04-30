'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber } from '@/lib/format';
import {
  axisTick,
  ChartGradients,
  ChartTooltipCard,
  gridStyle,
} from './chart-defs';
import type {
  ExpiringDayEntry,
  InventoryAnalytics,
} from '@/hooks/use-dashboard';

interface Props {
  data: ExpiringDayEntry[] | undefined;
  buckets: InventoryAnalytics['expiringBuckets'] | undefined;
  loading?: boolean;
}

interface TooltipPayload {
  payload: ExpiringDayEntry;
}

function shortDate(yyyymmdd: string): string {
  const parts = yyyymmdd.split('-');
  if (parts.length !== 3) return yyyymmdd;
  return `${parts[2]}/${parts[1]}`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const point = payload[0]!.payload;
  return (
    <ChartTooltipCard
      title={shortDate(label)}
      rows={[
        {
          label: 'Lotes',
          value: formatNumber(point.count),
          color: 'var(--warning)',
        },
        { label: 'Valor', value: formatCurrency(point.value) },
      ]}
    />
  );
}

export function ExpiringTimelineChart({ data, buckets, loading }: Props) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Próximos vencimientos</CardTitle>
        <CardDescription>
          Lotes disponibles o en cuarentena que vencen en los próximos 30 días
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <BucketCard
            label="Próximos 7 días"
            count={buckets?.within7}
            value={buckets?.value7}
            tone="destructive"
            loading={loading}
          />
          <BucketCard
            label="8 a 14 días"
            count={buckets?.within14}
            value={buckets?.value14}
            tone="warning"
            loading={loading}
          />
          <BucketCard
            label="15 a 30 días"
            count={buckets?.within30}
            value={buckets?.value30}
            tone="muted"
            loading={loading}
          />
        </div>

        {loading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : data && data.length > 0 ? (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <ChartGradients />
                <CartesianGrid {...gridStyle} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={axisTick}
                  tickFormatter={shortDate}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={axisTick}
                  tickFormatter={(v) => formatNumber(v)}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--warning)"
                  strokeWidth={2}
                  fill="url(#g-warning)"
                  name="Lotes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            No hay lotes con vencimiento en los próximos 30 días.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BucketCard({
  label,
  count,
  value,
  tone,
  loading,
}: {
  label: string;
  count: number | undefined;
  value: number | undefined;
  tone: 'destructive' | 'warning' | 'muted';
  loading?: boolean;
}) {
  const toneClasses =
    tone === 'destructive'
      ? 'border-destructive/30 bg-destructive/5'
      : tone === 'warning'
      ? 'border-warning/30 bg-warning/5'
      : 'border-border bg-surface-2/50';

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClasses}`}>
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-1.5 h-7 w-16" />
      ) : (
        <p className="mt-1 font-heading text-2xl font-medium tabular-nums tracking-tight">
          {count ?? 0}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {loading ? '—' : `${formatCurrency(value ?? 0)} en valor`}
      </p>
    </div>
  );
}
