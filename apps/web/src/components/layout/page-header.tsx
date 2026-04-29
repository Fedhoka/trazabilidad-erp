import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /** Main page title (rendered as h1). */
  title: string;
  /** Optional one-line description shown beneath the title. */
  description?: React.ReactNode;
  /** Optional right-side actions (Buttons, etc.). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard header block for dashboard pages.
 * Renders a left-aligned title + optional description, and right-aligned actions
 * that wrap to a new row on narrow screens.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
