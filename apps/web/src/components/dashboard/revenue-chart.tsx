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
import {
  formatCurrency,
  formatCurrencyCompact,
  formatMonthLabel,
} from '@/lib/format';
import {
  axisTick,
  ChartGradients,
  ChartTooltipCard,
  gridStyle,
} from './chart-defs';
import type { MonthlyStatPoint } from '@/hooks/use-dashboard';

interface RevenueAreaChartProps {
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
      title={
        <span className="capitalize">{formatMonthLabel(label)}</span>
      }
      rows={[
        {
          label: 'Facturación',
          value: formatCurrency(point.revenue),
          color: 'var(--chart-1)',
        },
        {
          label: 'Costos',
          value: formatCurrency(point.costs),
          color: 'var(--chart-2)',
        },
      ]}
      total={{ label: 'Margen', value: formatCurrency(point.margin) }}
    />
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
                <ChartGradients />
                <CartesianGrid {...gridStyle} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={axisTick}
                  tickFormatter={formatMonthLabel}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={axisTick}
                  tickFormatter={formatCurrencyCompact}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#g-revenue)"
                  name="Facturación"
                />
                <Area
                  type="monotone"
                  dataKey="costs"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  fill="url(#g-costs)"
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
