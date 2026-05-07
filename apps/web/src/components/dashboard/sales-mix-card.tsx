'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber } from '@/lib/format';
import { ChartTooltipCard } from './chart-defs';

export interface SalesMixSlice {
  /** Stable identifier — used as the colour key. */
  key: string;
  /** Display label. */
  label: string;
  revenue: number;
  invoiceCount: number;
}

interface Props {
  title: string;
  description: string;
  data: SalesMixSlice[] | undefined;
  /** Map from `key` to a CSS variable name (e.g. var(--chart-1)). */
  colorMap: Record<string, string>;
  loading?: boolean;
}

interface TooltipPayload {
  payload: SalesMixSlice;
}

function ChartTooltip({
  active,
  payload,
  colorMap,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  colorMap: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload;
  return (
    <ChartTooltipCard
      title={p.label}
      rows={[
        {
          label: 'Facturado',
          value: formatCurrency(p.revenue),
          color: colorMap[p.key],
        },
        { label: 'Facturas', value: formatNumber(p.invoiceCount) },
      ]}
    />
  );
}

/**
 * Reusable mix-by-X donut card. Used for the invoice type breakdown
 * and the payment method breakdown — same composition, different
 * data + colour map.
 */
export function SalesMixCard({
  title,
  description,
  data,
  colorMap,
  loading,
}: Props) {
  const chartData = (data ?? []).filter((d) => d.revenue > 0);
  const total = (data ?? []).reduce((acc, d) => acc + d.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : (
          <div className="grid grid-cols-[1fr_auto] items-center gap-6">
            <div className="h-[240px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="revenue"
                      nameKey="key"
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={2}
                      stroke="var(--background)"
                      strokeWidth={2}
                    >
                      {chartData.map((d) => (
                        <Cell
                          key={d.key}
                          fill={colorMap[d.key] ?? 'var(--muted)'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<ChartTooltip colorMap={colorMap} />}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sin datos en el período.
                </div>
              )}
            </div>
            <ul className="min-w-[180px] space-y-1.5 pr-2 text-sm">
              {(data ?? []).map((d) => (
                <li key={d.key} className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ background: colorMap[d.key] ?? 'var(--muted)' }}
                    aria-hidden
                  />
                  <span className="truncate text-muted-foreground">
                    {d.label}
                  </span>
                  <span className="ml-auto font-mono text-xs font-medium tabular-nums">
                    {total > 0
                      ? `${((d.revenue / total) * 100).toFixed(0)}%`
                      : '—'}
                  </span>
                </li>
              ))}
              <li className="mt-1 flex items-center gap-2 border-t border-border pt-2">
                <span className="text-muted-foreground">Total</span>
                <span className="ml-auto font-mono text-xs font-semibold">
                  {formatCurrency(total)}
                </span>
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
