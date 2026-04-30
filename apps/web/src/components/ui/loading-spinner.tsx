import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** Optional label rendered next to the spinner. */
  label?: string;
  /** Visual size: "sm" (16px), "md" (20px, default), "lg" (28px). */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Inline animated spinner with optional label. */
export function LoadingSpinner({
  label,
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  const sizeCls = size === 'sm' ? 'size-4' : size === 'lg' ? 'size-7' : 'size-5';
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 text-sm text-muted-foreground',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={cn('animate-spin text-primary', sizeCls)} aria-hidden />
      {label ? <span>{label}</span> : <span className="sr-only">Cargando…</span>}
    </div>
  );
}

/** Centered full-block spinner for "this section is loading" states. */
export function LoadingBlock({
  label = 'Cargando…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-[160px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
