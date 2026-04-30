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
import { axisTick, ChartTooltipCard, gridStyle } from './chart-defs';
import type { MonthlyStatPoint } from '@/hooks/use-dashboard';

interface ProductionChartProps {
  data: MonthlyStatPoint[] | undefined;
  loading?: boolean;
}

interface TooltipPayload {
  payload: MonthlyStatPoint;
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
      title={<span className="capitalize">{formatMonthLabel(label)}</span>}
      rows={[
        {
          label: 'Unidades',
          value: formatNumber(point.unitsProduced, { maximumFractionDigits: 2 }),
          color: 'var(--chart-3)',
        },
        {
          label: 'Facturas',
          value: formatNumber(point.invoiceCount),
          color: 'var(--chart-5)',
        },
      ]}
    />
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
                barCategoryGap="22%"
              >
                <CartesianGrid {...gridStyle} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={axisTick}
                  tickFormatter={formatMonthLabel}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="units"
                  tick={axisTick}
                  tickFormatter={(v) => formatNumber(v)}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  tick={axisTick}
                  tickFormatter={(v) => formatNumber(v)}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: 'var(--accent)', opacity: 0.45 }}
                />
                <Bar
                  yAxisId="units"
                  dataKey="unitsProduced"
                  name="Unidades producidas"
                  fill="var(--chart-3)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  yAxisId="count"
                  dataKey="invoiceCount"
                  name="Facturas"
                  fill="var(--chart-5)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
