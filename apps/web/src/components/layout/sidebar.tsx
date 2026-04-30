'use client';

import React from 'react';
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
  ClipboardList,
  ChevronsLeft,
  ChevronsRight,
  Sprout,
  BarChart3,
  Calculator,
  Scale,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Separator } from '@/components/ui/separator';
import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed';
import { initialsFromEmail, roleLabel } from '@/lib/display';
import { useMobileSidebar } from '@/context/mobile-sidebar-context';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  ownerOnly?: boolean;
};

type NavSection = {
  /** Section heading, hidden when sidebar is collapsed. */
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/stats', label: 'Estadísticas', icon: BarChart3 },
      { href: '/break-even', label: 'Punto de equilibrio', icon: Scale },
    ],
  },
  {
    label: 'Inventario',
    items: [
      { href: '/suppliers', label: 'Proveedores', icon: Truck },
      { href: '/materials', label: 'Materiales', icon: Package },
      { href: '/inventory', label: 'Inventario', icon: Layers },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { href: '/procurement', label: 'Compras', icon: ShoppingCart },
      { href: '/production', label: 'Producción', icon: Factory },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { href: '/customers', label: 'Clientes', icon: Users },
      { href: '/sales-orders', label: 'Ventas', icon: FileText },
      { href: '/fiscal', label: 'Fiscal', icon: Receipt },
      { href: '/help/afip', label: 'Manual AFIP', icon: BookOpen },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/fixed-costs', label: 'Costos fijos', icon: Calculator },
      { href: '/users', label: 'Usuarios', icon: Settings },
      { href: '/audit', label: 'Auditoría', icon: ClipboardList, ownerOnly: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { collapsed, toggle, hydrated } = useSidebarCollapsed();
  const { open: mobileOpen, close: closeMobile } = useMobileSidebar();

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <>
      {/* ── Mobile backdrop ──────────────────────────────────────── */}
      <div
        onClick={closeMobile}
        aria-hidden
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden',
          mobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
      />

      <aside
        // suppressHydrationWarning so localStorage-driven width doesn't yell on first paint
        suppressHydrationWarning
        data-collapsed={collapsed || undefined}
        className={cn(
          'group/sidebar fixed z-50 flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:relative md:z-auto',
          'transition-[width,transform] duration-200 ease-out',
          collapsed ? 'md:w-[68px]' : 'md:w-64',
          // Mobile: always full-width (forced expanded), slide in from left.
          'w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          // Avoid mid-flight transition before hydration
          !hydrated && 'transition-none',
        )}
      >
      {/* ── Brand header ─────────────────────────────────────────── */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Sprout className="size-5" aria-hidden />
        </div>
        <span
          className={cn(
            'flex-1 truncate text-sm font-semibold tracking-tight transition-opacity duration-150',
            collapsed && 'pointer-events-none opacity-0',
          )}
        >
          Trazabilidad
        </span>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className={cn(
            'hidden size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors md:inline-flex',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
          )}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
        </button>
      </div>

      {/* ── Nav sections ─────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {navSections.map((section, idx) => {
          const visibleItems = section.items.filter(
            (i) => !i.ownerOnly || user?.role === 'OWNER',
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label} className={cn(idx > 0 && 'mt-4')}>
              {/* Section header — fades to a thin separator when collapsed */}
              {collapsed ? (
                <div className="mx-3 mb-1 h-px bg-sidebar-border" aria-hidden />
              ) : (
                <div className="px-3 pb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {section.label}
                </div>
              )}

              <ul className="space-y-0.5 px-2">
                {visibleItems.map(({ href, label, icon: Icon }) => {
                  const isActive =
                    pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <li key={href} className="relative">
                      <Link
                        href={href}
                        title={collapsed ? label : undefined}
                        onClick={closeMobile}
                        className={cn(
                          'group/nav-item relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                        )}
                      >
                        {/* Active indicator bar on the left edge */}
                        {isActive && (
                          <span
                            aria-hidden
                            className="absolute -left-2 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                          />
                        )}
                        <Icon
                          className={cn(
                            'size-4 shrink-0',
                            isActive && 'text-primary',
                          )}
                        />
                        <span
                          className={cn(
                            'flex-1 truncate transition-opacity duration-150',
                            collapsed && 'pointer-events-none opacity-0',
                          )}
                        >
                          {label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* ── Profile section ──────────────────────────────────────── */}
      <Separator className="bg-sidebar-border" />
      <div className="space-y-1 p-2">
        {/* User row */}
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-md px-2 py-1.5',
            collapsed && 'justify-center px-0',
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/20">
            {initialsFromEmail(user?.email)}
          </div>
          <div
            className={cn(
              'min-w-0 flex-1 transition-opacity duration-150',
              collapsed && 'pointer-events-none hidden opacity-0',
            )}
          >
            <p className="truncate text-xs font-medium leading-tight text-foreground">
              {user?.email ?? '—'}
            </p>
            <p className="truncate text-[0.65rem] leading-tight text-muted-foreground">
              {roleLabel(user?.role)}
            </p>
          </div>
        </div>

        {/* Theme toggle: full when expanded, icon when collapsed */}
        {collapsed ? (
          <div className="flex justify-center">
            <ThemeToggle variant="icon" />
          </div>
        ) : (
          <ThemeToggle variant="full" />
        )}

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Salir' : undefined}
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm text-muted-foreground transition-colors',
            'hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="size-4 shrink-0" />
          <span
            className={cn(
              'flex-1 text-left transition-opacity duration-150',
              collapsed && 'pointer-events-none hidden opacity-0',
            )}
          >
            Salir
          </span>
        </button>
      </div>
      </aside>
    </>
  );
}
