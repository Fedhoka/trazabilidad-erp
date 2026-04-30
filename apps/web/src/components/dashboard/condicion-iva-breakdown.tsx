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
import type { CondicionIva, CondicionIvaEntry } from '@/hooks/use-dashboard';

const IVA_LABEL: Record<CondicionIva, string> = {
  RI: 'Resp. Inscripto',
  CF: 'Consumidor Final',
  MONO: 'Monotributo',
  EXENTO: 'Exento',
};

const IVA_COLOR: Record<CondicionIva, string> = {
  RI: 'var(--chart-1)',
  CF: 'var(--chart-2)',
  MONO: 'var(--chart-3)',
  EXENTO: 'var(--chart-4)',
};

interface Props {
  data: CondicionIvaEntry[] | undefined;
  loading?: boolean;
}

interface TooltipPayload {
  payload: CondicionIvaEntry;
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
      title={IVA_LABEL[point.condicionIva] ?? point.condicionIva}
      rows={[
        {
          label: 'Facturado',
          value: formatCurrency(point.revenue),
          color: IVA_COLOR[point.condicionIva],
        },
        { label: 'Clientes', value: formatNumber(point.customers) },
        { label: 'Facturas', value: formatNumber(point.invoiceCount) },
      ]}
    />
  );
}

export function CondicionIvaBreakdown({ data, loading }: Props) {
  // Filter zero-revenue entries from the donut visualisation but keep them
  // listed below so the user can still see "0 clientes Monotributo, $0 facturado".
  const chartData = (data ?? []).filter((d) => d.revenue > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución por condición IVA</CardTitle>
        <CardDescription>
          Facturación y clientes por categoría AFIP (últimos 12 meses)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : (
          <div className="grid grid-cols-[1fr_auto] items-center gap-6">
            <div className="h-[260px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="revenue"
                      nameKey="condicionIva"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                      stroke="var(--background)"
                      strokeWidth={2}
                    >
                      {chartData.map((d) => (
                        <Cell
                          key={d.condicionIva}
                          fill={IVA_COLOR[d.condicionIva] ?? 'var(--muted)'}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sin facturación en el período.
                </div>
              )}
            </div>
            <ul className="space-y-1.5 pr-2 text-sm">
              {(data ?? []).map((d) => (
                <li
                  key={d.condicionIva}
                  className="flex min-w-[180px] items-center gap-2"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ background: IVA_COLOR[d.condicionIva] }}
                    aria-hidden
                  />
                  <span className="text-muted-foreground">
                    {IVA_LABEL[d.condicionIva] ?? d.condicionIva}
                  </span>
                  <span className="ml-auto font-mono text-xs font-medium tabular-nums">
                    {formatNumber(d.customers)} cli
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
