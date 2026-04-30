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
import type { StockByKindEntry, MaterialKind } from '@/hooks/use-dashboard';

const KIND_LABEL: Record<MaterialKind, string> = {
  RAW: 'Materia prima',
  PACKAGING: 'Packaging',
  WIP: 'En proceso',
  FINISHED: 'Producto terminado',
};

// Semantic slot mapping — RAW gets the brand color (it's the most common),
// FINISHED gets olive (positive), others fall in line.
const KIND_COLOR: Record<MaterialKind, string> = {
  RAW: 'var(--chart-1)',
  PACKAGING: 'var(--chart-2)',
  WIP: 'var(--chart-3)',
  FINISHED: 'var(--chart-4)',
};

interface Props {
  data: StockByKindEntry[] | undefined;
  loading?: boolean;
}

interface TooltipPayload {
  payload: StockByKindEntry;
  value: number;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]!.payload;
  return (
    <ChartTooltipCard
      title={KIND_LABEL[point.kind] ?? point.kind}
      rows={[
        {
          label: 'Valor',
          value: formatCurrency(point.value),
          color: KIND_COLOR[point.kind],
        },
        { label: 'Lotes', value: formatNumber(point.lots) },
        {
          label: 'Unidades',
          value: formatNumber(point.units, { maximumFractionDigits: 2 }),
        },
      ]}
    />
  );
}

export function StockByKindChart({ data, loading }: Props) {
  const totalValue = (data ?? []).reduce((acc, d) => acc + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valor de stock por categoría</CardTitle>
        <CardDescription>
          Distribución del capital inmovilizado en lotes disponibles
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-[1fr_auto] items-center gap-4">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="kind"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                    stroke="var(--background)"
                    strokeWidth={2}
                  >
                    {data.map((d) => (
                      <Cell key={d.kind} fill={KIND_COLOR[d.kind] ?? 'var(--muted)'} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1.5 text-sm pr-2">
              {data.map((d) => (
                <li key={d.kind} className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ background: KIND_COLOR[d.kind] }}
                    aria-hidden
                  />
                  <span className="text-muted-foreground">
                    {KIND_LABEL[d.kind] ?? d.kind}
                  </span>
                  <span className="ml-auto font-mono text-xs font-medium">
                    {totalValue > 0
                      ? `${((d.value / totalValue) * 100).toFixed(0)}%`
                      : '—'}
                  </span>
                </li>
              ))}
              <li className="mt-2 flex items-center gap-2 border-t border-border pt-2">
                <span className="text-muted-foreground">Total</span>
                <span className="ml-auto font-mono text-xs font-semibold">
                  {formatCurrency(totalValue)}
                </span>
              </li>
            </ul>
          </div>
        ) : (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Sin lotes disponibles para mostrar.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
