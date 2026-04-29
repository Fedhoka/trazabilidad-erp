import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
}

/**
 * Compact KPI card with the value, an optional MoM delta chip, and a status
 * icon. Used across the new stats dashboard.
 */
export function MetricCard({
  label,
  value,
  delta,
  invertColors,
  icon: Icon,
  loading,
}: MetricCardProps) {
  const hasDelta = typeof delta === 'number' && Number.isFinite(delta);
  const isPositive = hasDelta && delta! > 0.05;
  const isNegative = hasDelta && delta! < -0.05;

  // For "good when up" metrics: green=up, red=down. For "good when down" (costs): inverted.
  const goodTone = invertColors ? 'text-destructive' : 'text-success';
  const badTone = invertColors ? 'text-success' : 'text-destructive';

  let deltaTone = 'text-muted-foreground';
  if (isPositive) deltaTone = invertColors ? badTone : goodTone;
  else if (isNegative) deltaTone = invertColors ? goodTone : badTone;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {Icon ? <Icon className="size-4 text-muted-foreground" aria-hidden /> : null}
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <div className="font-mono text-2xl font-semibold tracking-tight">
            {value}
          </div>
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
            <span>
              {delta! > 0 ? '+' : ''}
              {delta!.toFixed(1).replace('.', ',')} %
            </span>
            <span className="font-normal text-muted-foreground">vs. mes anterior</span>
          </div>
        ) : delta === null ? (
          <p className="text-xs text-muted-foreground">— sin datos del mes anterior</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
