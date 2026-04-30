import Link from 'next/link';
import { ShieldCheck, BadgeCheck, BarChart3 } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* ── Left brand panel ─────────────────────────────────────── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-surface-2 px-12 py-12 lg:flex xl:px-16">
        {/* Terracotta accent strip on the left edge */}
        <div
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"
        />

        {/* Top — wordmark */}
        <Link
          href="/login"
          className="inline-flex w-fit items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="trazabilidad — Inicio"
        >
          <span className="relative inline-flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
            <span
              aria-hidden
              className="absolute h-[20px] w-[3.5px] rounded-[1.5px] bg-primary-foreground"
              style={{ left: 18, top: 8 }}
            />
            <span
              aria-hidden
              className="absolute h-[3.5px] w-[12px] rounded-[1.5px] bg-primary-foreground"
              style={{ left: 14, top: 14 }}
            />
            <span
              aria-hidden
              className="absolute size-[5.5px] rounded-full bg-primary-foreground"
              style={{ right: 7, bottom: 7 }}
            />
          </span>
          <span className="font-heading text-[1.35rem] font-medium tracking-tight text-foreground">
            trazabilidad
          </span>
        </Link>

        {/* Middle — value prop + product preview */}
        <div className="space-y-10">
          <div className="space-y-4">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-primary">
              ERP · Argentina · AFIP
            </p>
            <h2 className="font-heading text-[2.6rem] font-medium leading-[1.05] tracking-tight text-foreground">
              El sistema diseñado para
              <br />
              <span className="text-primary">productores de alimentos.</span>
            </h2>
            <p className="max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
              Compras, producción, inventario, ventas y facturación electrónica
              en un solo lugar. Sin planillas paralelas, sin sorpresas con AFIP.
            </p>
          </div>

          {/* Static product preview — a real KPI card frozen at a representative moment */}
          <ProductPreview />
        </div>

        {/* Bottom — trust strip */}
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <li className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary/80" aria-hidden />
            Datos cifrados
          </li>
          <li className="inline-flex items-center gap-1.5">
            <BadgeCheck className="size-3.5 text-primary/80" aria-hidden />
            Cumple con AFIP
          </li>
          <li className="inline-flex items-center gap-1.5">
            <BarChart3 className="size-3.5 text-primary/80" aria-hidden />
            Trazabilidad de lote a factura
          </li>
        </ul>
      </aside>

      {/* ── Right form panel ─────────────────────────────────────── */}
      <main className="flex flex-col justify-center px-6 py-12 sm:px-12">
        {/* Mobile-only mini brand mark above the form */}
        <Link
          href="/login"
          aria-label="trazabilidad"
          className="mb-8 inline-flex w-fit items-center gap-2.5 self-center lg:hidden"
        >
          <span className="relative inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
            <span
              aria-hidden
              className="absolute h-[18px] w-[3px] rounded-[1.5px] bg-primary-foreground"
              style={{ left: 16, top: 7 }}
            />
            <span
              aria-hidden
              className="absolute h-[3px] w-[11px] rounded-[1.5px] bg-primary-foreground"
              style={{ left: 12, top: 12 }}
            />
            <span
              aria-hidden
              className="absolute size-[5px] rounded-full bg-primary-foreground"
              style={{ right: 6, bottom: 6 }}
            />
          </span>
          <span className="font-heading text-lg font-medium tracking-tight text-foreground">
            trazabilidad
          </span>
        </Link>

        <div className="mx-auto w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}

/**
 * Static product preview composition rendered as DOM — no screenshot, no
 * external image. Frozen at a representative dataset (April invoice month
 * with healthy MoM delta + a 5-bar mini production chart). This is the
 * actual visual language of the dashboard, not a marketing mockup.
 */
function ProductPreview() {
  // Heights for the mini bar chart (relative units, max 100)
  const bars = [42, 58, 71, 64, 86];

  return (
    <div
      aria-hidden
      className="relative w-full max-w-md rounded-2xl border border-border-strong/60 bg-card p-5 shadow-elevated"
    >
      <div className="space-y-1">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Facturación del mes
        </p>
        <p className="font-heading text-[2.25rem] font-medium leading-none tabular-nums tracking-tight text-foreground">
          $&nbsp;3.812.450
        </p>
        <p className="flex items-center gap-1 text-xs font-medium text-success">
          <span aria-hidden>↗</span>
          <span className="tabular-nums">+12,4 %</span>
          <span className="font-normal text-muted-foreground">
            vs. mes anterior
          </span>
        </p>
      </div>

      <div className="mt-6 flex h-20 items-end gap-1.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-primary/85"
            style={{ height: `${h}%`, opacity: 0.6 + i * 0.08 }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[0.65rem] text-muted-foreground">
        <span>Dic</span>
        <span>Ene</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Abr</span>
      </div>
    </div>
  );
}
