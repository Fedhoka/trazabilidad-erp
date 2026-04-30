import * as React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Smaller padding for empty states inside table rows. Default false. */
  compact?: boolean;
  className?: string;
}

/**
 * Friendly empty-state block. The icon sits in a single warm well
 * (--surface-2) without the previous double halo, which read too
 * "tutorial mode" for a paying customer's dashboard.
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
        compact ? 'gap-2.5 py-8' : 'gap-4 py-14',
        className,
      )}
    >
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-strong/40',
          compact ? 'size-12' : 'size-14',
        )}
      >
        <Icon
          className={cn(
            'text-primary',
            compact ? 'size-5' : 'size-6',
          )}
          aria-hidden
        />
      </div>

      <div className="max-w-sm space-y-1.5">
        <p
          className={cn(
            'font-heading font-medium text-foreground tracking-tight',
            compact ? 'text-base' : 'text-lg',
          )}
        >
          {title}
        </p>
        {description ? (
          <p
            className={cn(
              'leading-relaxed text-muted-foreground',
              compact ? 'text-xs' : 'text-sm',
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
