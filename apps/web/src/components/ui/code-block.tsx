'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  /** Optional label / language hint shown above the snippet. */
  label?: string;
  children: string;
  className?: string;
}

/**
 * Pre-formatted code block with a one-click copy-to-clipboard affordance.
 * Used in the AFIP manual for OpenSSL commands and configuration snippets.
 */
export function CodeBlock({ label, children, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard API unavailable — silently noop */
    }
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border bg-muted/40',
        className,
      )}
    >
      {label ? (
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/60 px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          <span>{label}</span>
        </div>
      ) : null}
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[0.78rem] leading-relaxed text-foreground/90">
        {children}
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label="Copiar al portapapeles"
        className={cn(
          'absolute right-2 inline-flex size-7 items-center justify-center rounded-md border border-border bg-background/70 text-muted-foreground backdrop-blur transition-colors',
          'hover:bg-background hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          label ? 'top-9' : 'top-2',
        )}
      >
        {copied ? (
          <Check className="size-3.5 text-success" aria-hidden />
        ) : (
          <Copy className="size-3.5" aria-hidden />
        )}
      </button>
    </div>
  );
}
