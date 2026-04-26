'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Package,
  Layers,
  ShoppingCart,
  Factory,
  Users,
  FileText,
  Receipt,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/suppliers', label: 'Proveedores', icon: Truck },
  { href: '/materials', label: 'Materiales', icon: Package },
  { href: '/inventory', label: 'Inventario', icon: Layers },
  { href: '/procurement', label: 'Compras', icon: ShoppingCart },
  { href: '/production', label: 'Producción', icon: Factory },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/sales-orders', label: 'Ventas', icon: FileText },
  { href: '/fiscal', label: 'Fiscal', icon: Receipt },
  { href: '/users', label: 'Usuarios', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center px-4 font-semibold tracking-tight">
        Trazabilidad
      </div>
      <Separator />
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
              pathname === href || pathname.startsWith(`${href}/`)
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <Separator />
      <div className="p-3">
        <p className="truncate px-1 text-xs text-muted-foreground">{user?.email}</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 w-full justify-start gap-2 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Salir
        </Button>
      </div>
    </aside>
  );
}
