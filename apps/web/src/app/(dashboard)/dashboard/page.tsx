'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  Factory,
  FileText,
  Layers,
  Package,
  Receipt,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  Boxes,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useDashboardKpis, useDashboardStats } from '@/hooks/use-dashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { formatCurrency, formatNumber, percentDelta } from '@/lib/format';
import { cn } from '@/lib/utils';

const moduleLinks = [
  { label: 'Proveedores', href: '/suppliers', icon: Truck },
  { label: 'Materiales', href: '/materials', icon: Package },
  { label: 'Inventario', href: '/inventory', icon: Layers },
  { label: 'Compras', href: '/procurement', icon: ShoppingCart },
  { label: 'Producción', href: '/production', icon: Factory },
  { label: 'Clientes', href: '/customers', icon: Users },
  { label: 'Ventas', href: '/sales-orders', icon: FileText },
  { label: 'Fiscal', href: '/fiscal', icon: Receipt },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: kpis, isLoading: kpisLoading } = useDashboardKpis();
  const { data: stats, isLoading: statsLoading } = useDashboardStats(6);

  const lastMonth = stats?.months[stats.months.length - 1];
  const prevMonth = stats?.months[stats.months.length - 2];
  const revenueDelta = percentDelta(lastMonth?.revenue, prevMonth?.revenue);

  const greetingName = user?.email?.split('@')[0]?.split(/[._-]/)[0] ?? '';
  const eyebrow = greetingName
    ? `Hola, ${greetingName.charAt(0).toUpperCase()}${greetingName.slice(1)}`
    : 'Hola';

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title="Cómo está tu empresa hoy"
        description="Un resumen rápido de las métricas que importan. Profundizá en Estadísticas para series completas."
        actions={
          <Link href="/stats">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border-strong/70 bg-surface px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
              Ver estadísticas
              <ArrowUpRight className="size-3.5" aria-hidden />
            </span>
          </Link>
        }
      />

      {/* ── Bento — 12-col asymmetric grid ─────────────────────────
       *   Featured KPI: 7 cols × 2 rows (revenue + sparkline)
       *   Secondary KPIs: 5 cols, two stacked (margin + units)
       *   Small chips: 4 × 3 cols underneath
       *  ──────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
        {/* Featured — facturación del mes con sparkline */}
        <FeaturedRevenueCard
          revenue={lastMonth?.revenue}
          delta={revenueDelta}
          spark={stats?.months.map((m) => m.revenue) ?? []}
          loading={statsLoading}
        />

        {/* Secondary — margen + unidades, stacked */}
        <SmallKpi
          className="lg:col-span-5"
          label="Margen del mes"
          value={lastMonth?.margin}
          format="currency"
          icon={TrendingUp}
          loading={statsLoading}
        />
        <SmallKpi
          className="lg:col-span-5"
          label="Unidades producidas"
          value={lastMonth?.unitsProduced}
          format="number"
          icon={Boxes}
          loading={statsLoading}
        />

        {/* Small chips */}
        <ChipKpi
          label="Lotes disponibles"
          value={kpis?.availableLots}
          format="number"
          icon={Package}
          loading={kpisLoading}
        />
        <ChipKpi
          label="Valor en stock"
          value={kpis?.stockValue}
          format="currency"
          icon={Wallet}
          loading={kpisLoading}
        />
        <ChipKpi
          label="OC abiertas"
          value={kpis?.pendingPos}
          format="number"
          icon={ShoppingCart}
          loading={kpisLoading}
        />
        <ChipKpi
          label="Pedidos abiertos"
          value={kpis?.openSalesOrders}
          format="number"
          icon={FileText}
          loading={kpisLoading}
        />
        <ChipKpi
          label="Producción en curso"
          value={kpis?.inProgressOrders}
          format="number"
          icon={RefreshCw}
          loading={kpisLoading}
        />
        <ChipKpi
          label="Facturas del mes"
          value={kpis?.monthInvoiceCount}
          format="number"
          icon={ClipboardList}
          loading={kpisLoading}
        />
        <ChipKpi
          label="Facturado este mes"
          value={kpis?.monthInvoiceTotal}
          format="currency"
          icon={Receipt}
          loading={kpisLoading}
        />
        <ChipKpi
          label="Vencen en 7 días"
          value={kpis?.expiringSoon}
          format="number"
          icon={AlertTriangle}
          tone="warning"
          loading={kpisLoading}
        />
      </section>

      {/* ── Module quick-links — single horizontal strip ─────────── */}
      <section className="space-y-3 pt-2">
        <div>
          <h2 className="font-heading text-lg font-medium tracking-tight text-foreground">
            Atajos
          </h2>
          <p className="text-sm text-muted-foreground">
            Saltá directo al módulo que necesitás
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {moduleLinks.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group/link flex flex-col items-start gap-2 rounded-lg border border-border-strong/60 bg-card p-3.5 transition-[background-color,border-color,transform] duration-(--duration-fast) ease-(--ease-snap) hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/50"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-md bg-surface-2 text-primary transition-colors group-hover/link:bg-primary group-hover/link:text-primary-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-sm font-medium text-foreground">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

// ─── Featured revenue card with inline sparkline ──────────────────
function FeaturedRevenueCard({
  revenue,
  delta,
  spark,
  loading,
}: {
  revenue: number | undefined;
  delta: number | null;
  spark: number[];
  loading: boolean;
}) {
  const max = Math.max(...spark, 1);
  const isPositive = delta !== null && delta > 0.05;
  const isNegative = delta !== null && delta < -0.05;
  const deltaTone = isPositive
    ? 'text-success'
    : isNegative
    ? 'text-destructive'
    : 'text-muted-foreground';

  return (
    <Card className="overflow-hidden lg:col-span-7 lg:row-span-2">
      <CardHeader className="pb-2">
        <CardDescription className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Facturación del mes
        </CardDescription>
        <CardTitle className="font-heading text-[2.75rem] font-medium leading-none tabular-nums tracking-tight text-foreground">
          {loading ? (
            <Skeleton className="h-12 w-56" />
          ) : (
            formatCurrency(revenue ?? 0)
          )}
        </CardTitle>
        {delta !== null && Number.isFinite(delta) ? (
          <p className={cn('flex items-center gap-1 text-sm font-medium', deltaTone)}>
            <span aria-hidden>{isPositive ? '↗' : isNegative ? '↘' : '→'}</span>
            <span className="tabular-nums">
              {delta > 0 ? '+' : ''}
              {delta.toFixed(1).replace('.', ',')} %
            </span>
            <span className="font-normal text-muted-foreground">
              vs. mes anterior
            </span>
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="pb-6">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="flex h-28 items-end gap-1.5">
            {spark.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-primary/85 transition-opacity"
                style={{
                  height: `${(v / max) * 100}%`,
                  opacity: 0.55 + (i / spark.length) * 0.45,
                }}
              />
            ))}
          </div>
        )}
        <div className="mt-2 flex justify-between text-[0.65rem] text-muted-foreground">
          {spark.map((_, i) => {
            // Show first, middle, last labels only for cleanliness
            const showLabel =
              i === 0 || i === spark.length - 1 || i === Math.floor(spark.length / 2);
            return (
              <span key={i}>
                {showLabel && spark.length > 0 ? `M${i + 1}` : ''}
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Medium KPI used for margin + units ───────────────────────────
function SmallKpi({
  label,
  value,
  format,
  icon: Icon,
  loading,
  className,
}: {
  label: string;
  value: number | undefined;
  format: 'number' | 'currency';
  icon: React.ElementType;
  loading: boolean;
  className?: string;
}) {
  const display = loading ? (
    <Skeleton className="h-9 w-32" />
  ) : (
    <p className="font-heading text-[1.85rem] font-medium leading-none tabular-nums tracking-tight text-foreground">
      {format === 'currency' ? formatCurrency(value ?? 0) : formatNumber(value ?? 0)}
    </p>
  );

  return (
    <Card className={className}>
      <CardContent className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-surface-2 text-muted-foreground">
            <Icon className="size-3.5" aria-hidden />
          </span>
        </div>
        {display}
      </CardContent>
    </Card>
  );
}

// ─── Compact chip for the row of secondary metrics ────────────────
function ChipKpi({
  label,
  value,
  format,
  icon: Icon,
  loading,
  tone,
}: {
  label: string;
  value: number | undefined;
  format: 'number' | 'currency';
  icon: React.ElementType;
  loading: boolean;
  tone?: 'warning';
}) {
  const display = loading ? (
    <Skeleton className="h-6 w-20" />
  ) : (
    <p className="font-heading text-xl font-medium leading-none tabular-nums tracking-tight text-foreground">
      {format === 'currency' ? formatCurrency(value ?? 0) : formatNumber(value ?? 0)}
    </p>
  );

  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-2 rounded-lg border border-border-strong/60 bg-card p-3.5 lg:col-span-3',
        tone === 'warning' &&
          'border-warning/30 bg-warning/[0.04]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <Icon
          className={cn(
            'size-3.5 shrink-0',
            tone === 'warning' ? 'text-warning' : 'text-muted-foreground',
          )}
          aria-hidden
        />
      </div>
      {display}
    </div>
  );
}
