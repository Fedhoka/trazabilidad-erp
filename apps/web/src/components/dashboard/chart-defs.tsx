'use client';

import * as React from 'react';

/**
 * Shared SVG <defs> for area/line gradients used across the dashboard
 * charts. Each gradient stop reads a CSS variable, so dark/light mode
 * switching is automatic and no chart needs to know about colors directly.
 *
 * Convention — gradient ids match the semantic role of the data series:
 *   - revenue   → --chart-1 (terracotta)
 *   - costs     → --chart-2 (roasted brown)
 *   - units     → --chart-3 (mustard)
 *   - positive  → --chart-4 (olive)
 *   - neutral   → --chart-5 (slate-blue)
 *   - outlier   → --chart-6 (plum)
 */
export function ChartGradients() {
  const slots: Array<{ id: string; varName: string; topAlpha: number }> = [
    { id: 'g-revenue', varName: '--chart-1', topAlpha: 0.30 },
    { id: 'g-costs', varName: '--chart-2', topAlpha: 0.22 },
    { id: 'g-units', varName: '--chart-3', topAlpha: 0.28 },
    { id: 'g-positive', varName: '--chart-4', topAlpha: 0.28 },
    { id: 'g-neutral', varName: '--chart-5', topAlpha: 0.22 },
    { id: 'g-outlier', varName: '--chart-6', topAlpha: 0.22 },
    { id: 'g-warning', varName: '--warning', topAlpha: 0.30 },
  ];

  return (
    <defs>
      {slots.map(({ id, varName, topAlpha }) => (
        <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="5%"
            stopColor={`var(${varName})`}
            stopOpacity={topAlpha}
          />
          <stop
            offset="95%"
            stopColor={`var(${varName})`}
            stopOpacity={0}
          />
        </linearGradient>
      ))}
    </defs>
  );
}

/** Default Recharts axis tick style — used by every chart. */
export const axisTick = {
  fill: 'var(--muted-foreground)',
  fontSize: 11,
  fontFamily: 'var(--font-sans)',
} as const;

/** Default Recharts grid line style. */
export const gridStyle = {
  stroke: 'var(--border)',
  strokeDasharray: '3 3',
} as const;

/**
 * Shared chart tooltip wrapper. Renders a Card-style popover with rows of
 * label/value pairs. Charts pass an array of { label, value, color } and
 * the tooltip handles the rest — no per-chart tooltip duplication.
 */
export function ChartTooltipCard({
  title,
  rows,
  total,
}: {
  title: React.ReactNode;
  rows: Array<{ label: string; value: React.ReactNode; color?: string }>;
  /** Optional emphasised row appended at the bottom (e.g. "Margen"). */
  total?: { label: string; value: React.ReactNode };
}) {
  return (
    <div className="rounded-lg border border-border-strong/70 bg-popover px-3 py-2 text-xs shadow-elevated">
      <p className="mb-1.5 font-heading font-medium tracking-tight text-foreground">
        {title}
      </p>
      <div className="space-y-0.5">
        {rows.map((r, i) => (
          <p
            key={`${r.label}-${i}`}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {r.color ? (
                <span
                  className="size-2 rounded-full"
                  style={{ background: r.color }}
                  aria-hidden
                />
              ) : null}
              {r.label}
            </span>
            <span className="font-mono font-medium tabular-nums text-foreground">
              {r.value}
            </span>
          </p>
        ))}
        {total ? (
          <p className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-1">
            <span className="text-muted-foreground">{total.label}</span>
            <span className="font-mono font-medium tabular-nums text-foreground">
              {total.value}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
