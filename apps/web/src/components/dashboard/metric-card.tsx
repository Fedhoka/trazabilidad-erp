import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  /** Optional MoM delta (percent). null = "no comparison available". */
  delta?: number | null;
  /** Some metrics are better when they decrease (e.g. costs). */
  invertColors?: boolean;
  icon?: React.ElementType;
  loading?: boolean;
  /** Featured size — bigger value, used for the dashboard hero KPI. */
  featured?: boolean;
}

/**
 * KPI card. The headline number uses Fraunces (display serif) at a generous
 * size for editorial gravity; secondary chrome (label, delta, icon) stays in
 * Inter. Tabular figures by default so columns align in a strip.
 */
export function MetricCard({
  label,
  value,
  delta,
  invertColors,
  icon: Icon,
  loading,
  featured = false,
}: MetricCardProps) {
  const hasDelta = typeof delta === 'number' && Number.isFinite(delta);
  const isPositive = hasDelta && delta! > 0.05;
  const isNegative = hasDelta && delta! < -0.05;

  const goodTone = invertColors ? 'text-destructive' : 'text-success';
  const badTone = invertColors ? 'text-success' : 'text-destructive';

  let deltaTone = 'text-muted-foreground';
  if (isPositive) deltaTone = invertColors ? badTone : goodTone;
  else if (isNegative) deltaTone = invertColors ? goodTone : badTone;

  return (
    <Card>
      <CardContent className="space-y-3 pt-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          {Icon ? (
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted-foreground">
              <Icon className="size-3.5" aria-hidden />
            </span>
          ) : null}
        </div>

        {loading ? (
          <Skeleton className={cn('w-32', featured ? 'h-12' : 'h-9')} />
        ) : (
          <p
            className={cn(
              'font-heading font-medium leading-none tabular-nums tracking-tight text-foreground',
              featured ? 'text-[2.5rem]' : 'text-[1.75rem]',
            )}
          >
            {value}
          </p>
        )}

        {hasDelta ? (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              deltaTone,
            )}
            aria-label={`Variación respecto al mes anterior: ${delta!.toFixed(1)} %`}
          >
            {isPositive ? (
              <ArrowUpRight className="size-3.5" aria-hidden />
            ) : isNegative ? (
              <ArrowDownRight className="size-3.5" aria-hidden />
            ) : (
              <Minus className="size-3.5" aria-hidden />
            )}
            <span className="tabular-nums">
              {delta! > 0 ? '+' : ''}
              {delta!.toFixed(1).replace('.', ',')} %
            </span>
            <span className="font-normal text-muted-foreground">
              vs. mes anterior
            </span>
          </div>
        ) : delta === null ? (
          <p className="text-xs text-muted-foreground">
            — sin datos del mes anterior
          </p>
        ) : (
          // Reserve vertical rhythm so cards in a row stay aligned even
          // when one has no delta to show.
          <div className="h-4" aria-hidden />
        )}
      </CardContent>
    </Card>
  );
}
