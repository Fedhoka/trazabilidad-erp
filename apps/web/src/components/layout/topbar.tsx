'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Static segment label map. Anything not here is title-cased. */
const ROUTE_NAMES: Record<string, string> = {
  dashboard: 'Dashboard',
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

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/60 bg-background/85 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      {/* ── Breadcrumbs ──────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
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
                      isLast ? 'font-medium text-foreground' : 'text-muted-foreground',
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

      {/* ── Global search (UI only — wiring in a later step) ─────── */}
      <div className="relative hidden min-w-[260px] sm:block">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Buscar…"
          aria-label="Búsqueda global"
          // Currently inert; styling is real but onSubmit is a no-op until wired up.
          className={cn(
            'h-9 w-full rounded-lg border border-input bg-background pl-9 pr-12 text-sm',
            'placeholder:text-muted-foreground/70',
            'transition-[border-color,box-shadow] outline-none',
            'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
            'dark:bg-input/30',
          )}
        />
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-0.5 rounded border border-border bg-muted/60 px-1.5 font-mono text-[0.65rem] font-medium text-muted-foreground sm:inline-flex"
        >
          /
        </kbd>
      </div>
    </header>
  );
}
