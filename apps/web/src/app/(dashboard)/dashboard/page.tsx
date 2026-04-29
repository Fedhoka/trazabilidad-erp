'use client';

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useDashboardKpis } from '@/hooks/use-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import {
  Truck, Package, Layers, ShoppingCart, Factory, Users, FileText, Receipt, Settings,
  BoxIcon, TrendingUp, ClipboardList, RefreshCw, AlertTriangle,
} from 'lucide-react';

const quickLinks = [
  { label: 'Proveedores', href: '/suppliers', icon: Truck },
  { label: 'Materiales', href: '/materials', icon: Package },
  { label: 'Inventario', href: '/inventory', icon: Layers },
  { label: 'Compras', href: '/procurement', icon: ShoppingCart },
  { label: 'Producción', href: '/production', icon: Factory },
  { label: 'Clientes', href: '/customers', icon: Users },
  { label: 'Ventas', href: '/sales-orders', icon: FileText },
  { label: 'Fiscal', href: '/fiscal', icon: Receipt },
  { label: 'Usuarios', href: '/users', icon: Settings },
];

function KpiCard({
  label, value, icon: Icon, format = 'number',
}: {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  format?: 'number' | 'currency';
}) {
  const display =
    value === undefined ? (
      <Skeleton className="h-7 w-20 mt-1" />
    ) : format === 'currency' ? (
      <span className="font-mono text-2xl font-semibold">
        {'$ '}
        {value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    ) : (
      <span className="font-mono text-2xl font-semibold">
        {value.toLocaleString('es-AR')}
      </span>
    );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>{display}</CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: kpis } = useDashboardKpis();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Bienvenido${user?.email ? `, ${user.email}` : ''}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Lotes disponibles" value={kpis?.availableLots} icon={BoxIcon} />
        <KpiCard label="Valor en stock" value={kpis?.stockValue} icon={TrendingUp} format="currency" />
        <KpiCard label="Compras abiertas" value={kpis?.pendingPos} icon={ShoppingCart} />
        <KpiCard label="Ventas abiertas" value={kpis?.openSalesOrders} icon={FileText} />
        <KpiCard label="Producción en curso" value={kpis?.inProgressOrders} icon={RefreshCw} />
        <KpiCard label="Facturas del mes" value={kpis?.monthInvoiceCount} icon={ClipboardList} />
        <KpiCard label="Facturado este mes" value={kpis?.monthInvoiceTotal} icon={Receipt} format="currency" />
        <KpiCard label="Lotes por vencer (7 d)" value={kpis?.expiringSoon} icon={AlertTriangle} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Módulos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center gap-3 py-3">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <CardTitle className="text-sm">{label}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
