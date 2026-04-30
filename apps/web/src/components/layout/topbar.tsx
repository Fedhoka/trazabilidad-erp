'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileSidebar } from '@/context/mobile-sidebar-context';

/** Static segment label map. Anything not here is title-cased. */
const ROUTE_NAMES: Record<string, string> = {
  dashboard: 'Dashboard',
  stats: 'Estadísticas',
  suppliers: 'Proveedores',
  materials: 'Materiales',
  inventory: 'Inventario',
  procurement: 'Compras',
  production: 'Producción',
  orders: 'Órdenes',
  traceability: 'Trazabilidad',
  customers: 'Clientes',
  'sales-orders': 'Ventas',
  fiscal: 'Fiscal',
  'fixed-costs': 'Costos fijos',
  'break-even': 'Punto de equilibrio',
  help: 'Ayuda',
  afip: 'AFIP',
  users: 'Usuarios',
  audit: 'Auditoría',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
}

type Crumb = { label: string; href?: string };

function buildCrumbs(pathname: string): Crumb[] {
  const parts = pathname.split('/').filter(Boolean);
  // Treat /dashboard as the root: a single non-linked "Inicio".
  if (parts.length === 1 && parts[0] === 'dashboard') {
    return [{ label: 'Inicio' }];
  }
  const crumbs: Crumb[] = [{ label: 'Inicio', href: '/dashboard' }];
  let acc = '';
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i]!;
    acc += '/' + seg;
    const isLast = i === parts.length - 1;
    // Dynamic UUID segments → "Detalle"
    if (UUID_RE.test(seg)) {
      crumbs.push({ label: 'Detalle', href: isLast ? undefined : acc });
      continue;
    }
    const label = ROUTE_NAMES[seg] ?? titleCase(seg);
    crumbs.push({ label, href: isLast ? undefined : acc });
  }
  return crumbs;
}

export function Topbar() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);
  const { toggle: toggleMobile } = useMobileSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
      {/* ── Mobile menu trigger ──────────────────────────────────── */}
      <button
        type="button"
        onClick={toggleMobile}
        aria-label="Abrir menú"
        className={cn(
          'inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors md:hidden',
          'hover:bg-muted hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* ── Breadcrumbs ──────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li
                key={`${crumb.label}-${i}`}
                className={cn(
                  'flex min-w-0 items-center gap-1.5',
                  // On mobile only show the current (last) crumb
                  !isLast && 'hidden md:flex',
                )}
              >
                {i > 0 && (
                  <ChevronRight
                    className="size-3.5 shrink-0 text-muted-foreground/60"
                    aria-hidden
                  />
                )}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="truncate text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'truncate',
                      isLast
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground',
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/*
        Search was previously here but inert. Removed until cmd+K palette
        ships as a real feature — a non-functional input is worse than no
        input. Right side reserved for future actions (notifications,
        user menu, command palette trigger).
      */}
    </header>
  );
}
