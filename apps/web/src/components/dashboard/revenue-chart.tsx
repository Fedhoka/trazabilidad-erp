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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatMonthLabel,
} from '@/lib/format';
import type { MonthlyStatPoint } from '@/hooks/use-dashboard';

interface RevenueAreaChartProps {
  data: MonthlyStatPoint[] | undefined;
  loading?: boolean;
}

interface TooltipPayload {
  payload: MonthlyStatPoint;
  value: number;
  dataKey: string;
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
      <p className="mb-1.5 font-semibold capitalize text-foreground">
        {formatMonthLabel(label)}
      </p>
      <div className="space-y-0.5">
        <p className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Facturación</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(point.revenue)}
          </span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Costos</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(point.costs)}
          </span>
        </p>
        <p className="mt-1 flex items-center justify-between gap-4 border-t border-border/60 pt-1">
          <span className="text-muted-foreground">Margen</span>
          <span className="font-mono font-medium text-foreground">
            {formatCurrency(point.margin)}
          </span>
        </p>
      </div>
    </div>
  );
}

export function RevenueAreaChart({ data, loading }: RevenueAreaChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Facturación y costos</CardTitle>
        <CardDescription>
          Evolución mensual de los últimos 12 meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data ?? []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-costs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickFormatter={formatMonthLabel}
                  axisLine={false}
                  tickLine={false}
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
                  cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#grad-revenue)"
                  name="Facturación"
                />
                <Area
                  type="monotone"
                  dataKey="costs"
                  stroke="var(--chart-4)"
                  strokeWidth={2}
                  fill="url(#grad-costs)"
                  name="Costos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
