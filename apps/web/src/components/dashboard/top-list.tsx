'use client';

import { Trophy } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';

export interface TopListItem {
  id: string;
  primary: string;
  secondary?: string;
  /** Right-side numeric value (already formatted). */
  metric: string;
  /** Numeric "share of total" — 0..1. Used for the inline progress bar. */
  share: number;
}

interface Props {
  title: string;
  description?: string;
  items: TopListItem[] | undefined;
  loading?: boolean;
  emptyLabel?: string;
}

export function TopList({
  title,
  description,
  items,
  loading,
  emptyLabel = 'Sin datos en los últimos 12 meses.',
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))
        ) : items && items.length > 0 ? (
          items.map((item, i) => (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center gap-3 text-sm">
                <span
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-xs font-semibold tabular-nums text-muted-foreground"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {item.primary}
                  </p>
                  {item.secondary ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {item.secondary}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                  {item.metric}
                </span>
              </div>
              {/* Inline progress bar shows share of #1 */}
              <div className="ml-9 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all"
                  style={{ width: `${Math.min(100, Math.max(2, item.share * 100))}%` }}
                  aria-hidden
                />
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Trophy className="size-6 opacity-40" aria-hidden />
            {emptyLabel}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Convenience: builds TopListItem array from any array of {revenue} entries. */
export function buildTopListItems<T extends { revenue: number }>(
  rows: T[] | undefined,
  primary: (r: T) => string,
  secondary: (r: T) => string | undefined,
  id: (r: T) => string,
): TopListItem[] {
  if (!rows || rows.length === 0) return [];
  const max = Math.max(...rows.map((r) => r.revenue), 1);
  return rows.map((r) => ({
    id: id(r),
    primary: primary(r),
    secondary: secondary(r),
    metric: formatCurrency(r.revenue),
    share: r.revenue / max,
  }));
}
