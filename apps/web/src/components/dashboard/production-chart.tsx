'use client';

import {
  Bar,
  BarChart,
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
import { formatNumber, formatMonthLabel } from '@/lib/format';
import type { MonthlyStatPoint } from '@/hooks/use-dashboard';

interface ProductionChartProps {
  data: MonthlyStatPoint[] | undefined;
  loading?: boolean;
}

interface TooltipPayload {
  payload: MonthlyStatPoint;
  value: number;
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
          <span className="text-muted-foreground">Unidades producidas</span>
          <span className="font-mono font-medium text-foreground">
            {formatNumber(point.unitsProduced, { maximumFractionDigits: 2 })}
          </span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Facturas emitidas</span>
          <span className="font-mono font-medium text-foreground">
            {formatNumber(point.invoiceCount)}
          </span>
        </p>
      </div>
    </div>
  );
}

export function ProductionBarChart({ data, loading }: ProductionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Producción y facturación</CardTitle>
        <CardDescription>
          Volumen producido y cantidad de facturas por mes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data ?? []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                barCategoryGap="20%"
              >
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
                  yAxisId="units"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickFormatter={(v) => formatNumber(v)}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickFormatter={(v) => formatNumber(v)}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: 'var(--accent)', opacity: 0.4 }}
                />
                <Bar
                  yAxisId="units"
                  dataKey="unitsProduced"
                  name="Unidades producidas"
                  fill="var(--chart-2)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  yAxisId="count"
                  dataKey="invoiceCount"
                  name="Facturas"
                  fill="var(--chart-3)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
