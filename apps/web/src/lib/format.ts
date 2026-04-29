/** ARS-locale currency without unit: "1.234,56". Add the "$" yourself if you want it. */
export function formatNumber(
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  });
}

/** "$ 1.234,56" with two decimals. */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `$ ${value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Compact currency for crowded chart axes: "$ 1,2k", "$ 3,4M". */
export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (abs >= 1_000) return `$ ${(value / 1_000).toFixed(1).replace('.', ',')}k`;
  return `$ ${value.toFixed(0)}`;
}

/** "12,3 %" */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(digits).replace('.', ',')} %`;
}

/** "abr 2026" — Spanish month label from a "YYYY-MM" string. */
export function formatMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  if (!y || !m) return yyyymm;
  const monthIdx = Number(m) - 1;
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  return `${months[monthIdx] ?? m} ${y.slice(2)}`;
}

/**
 * Computes the percent delta between current and previous values.
 * Returns null if previous is 0/missing (delta is undefined in that case).
 */
export function percentDelta(
  current: number | undefined,
  previous: number | undefined,
): number | null {
  if (current === undefined || previous === undefined) return null;
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
