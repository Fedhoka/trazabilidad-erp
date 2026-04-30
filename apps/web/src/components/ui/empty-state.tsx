import * as React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Primary icon — rendered with a tinted ring backdrop. */
  icon: React.ElementType;
  title: string;
  description?: React.ReactNode;
  /** Optional CTA button (or any element) below the description. */
  action?: React.ReactNode;
  /** Smaller padding for empty states inside table rows. Default false. */
  compact?: boolean;
  className?: string;
}

/**
 * Friendly empty-state block. Used everywhere a list/table comes back empty.
 * The icon is wrapped in a soft primary halo so it reads as "intentionally
 * empty" instead of "broken".
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 py-8' : 'gap-3 py-12',
        className,
      )}
    >
      {/* Icon with multi-layered halo for a softer, more illustrative feel */}
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center',
          compact ? 'size-12' : 'size-16',
        )}
      >
        <span
          className="absolute inset-0 rounded-full bg-primary/8 ring-1 ring-primary/10"
          aria-hidden
        />
        <span
          className={cn(
            'absolute rounded-full bg-primary/12',
            compact ? 'inset-1.5' : 'inset-2',
          )}
          aria-hidden
        />
        <Icon
          className={cn(
            'relative text-primary',
            compact ? 'size-5' : 'size-7',
          )}
          aria-hidden
        />
      </div>

      <div className="max-w-sm space-y-1">
        <p className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>
          {title}
        </p>
        {description ? (
          <p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
