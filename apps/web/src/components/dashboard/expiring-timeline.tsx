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
import type { ExpiringDayEntry, InventoryAnalytics } from '@/hooks/use-dashboard';

interface Props {
  data: ExpiringDayEntry[] | undefined;
  buckets: InventoryAnalytics['expiringBuckets'] | undefined;
  loading?: boolean;
}

interface TooltipPayload {
  payload: ExpiringDayEntry;
  value: number;
}

/** "DD/MM" — short label for the X axis. */
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
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-elevated">
      <p className="mb-1.5 font-semibold text-foreground">{shortDate(label)}</p>
      <div className="space-y-0.5">
        <p className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Lotes</span>
          <span className="font-mono font-medium text-foreground">
            {formatNumber(point.count)}
          </span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Valor</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(point.value)}
          </span>
        </p>
      </div>
    </div>
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
        {/* Bucket strip */}
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
                <defs>
                  <linearGradient id="grad-expiring" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--warning)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickFormatter={shortDate}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickFormatter={(v) => formatNumber(v)}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border)' }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--warning)"
                  strokeWidth={2}
                  fill="url(#grad-expiring)"
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
      : 'border-border bg-muted/30';

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClasses}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-1 h-7 w-16" />
      ) : (
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
          {count ?? 0}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {loading ? '—' : `${formatCurrency(value ?? 0)} en valor`}
      </p>
    </div>
  );
}
