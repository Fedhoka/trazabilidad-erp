'use client';

import { AlertTriangle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/format';
import type { LowStockEntry, MaterialKind } from '@/hooks/use-dashboard';

const KIND_LABEL: Record<MaterialKind, string> = {
  RAW: 'M. prima',
  PACKAGING: 'Packaging',
  WIP: 'En proceso',
  FINISHED: 'Terminado',
};

interface Props {
  data: LowStockEntry[] | undefined;
  loading?: boolean;
}

export function LowStockTable({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock más bajo</CardTitle>
        <CardDescription>
          Top 10 materiales activos ordenados por menor cantidad disponible
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {loading ? (
          <div className="space-y-2 px-5 pb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <ul className="divide-y divide-border/60">
            {data.map((m) => {
              const isOutOfStock = m.available <= 0;
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-5 py-2.5 text-sm"
                >
                  {isOutOfStock ? (
                    <AlertTriangle
                      className="size-4 shrink-0 text-destructive"
                      aria-label="Sin stock"
                    />
                  ) : (
                    <span
                      className="size-2 shrink-0 rounded-full bg-warning"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {m.name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {m.code}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {KIND_LABEL[m.kind] ?? m.kind}
                  </Badge>
                  <span
                    className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${
                      isOutOfStock ? 'text-destructive' : 'text-foreground'
                    }`}
                  >
                    {formatNumber(m.available, { maximumFractionDigits: 2 })}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      {m.baseUom}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Sin materiales activos.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
