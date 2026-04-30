import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** Main page title — rendered as h1 in Fraunces. */
  title: string;
  /** Optional one-line description shown beneath the title. */
  description?: React.ReactNode;
  /** Optional kicker / eyebrow above the title (small caps treatment). */
  eyebrow?: string;
  /** Optional right-side actions (Buttons, etc.). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard header block for dashboard pages. The h1 uses Fraunces (display
 * serif) at 1.875rem with the optical-size axis pushed up for proper
 * editorial contrast. Description and eyebrow stay in Inter for clarity at
 * small sizes.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 pb-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6',
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? (
          <p className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[1.875rem] font-medium leading-[1.15] text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
