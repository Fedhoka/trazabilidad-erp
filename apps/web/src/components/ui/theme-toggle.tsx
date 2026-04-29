'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  /** Render style: icon-only (default) or full button with label */
  variant?: 'icon' | 'full';
  className?: string;
}

/**
 * Toggle between light and dark themes.
 * Hydration-safe: renders a placeholder until mounted to avoid SSR/CSR mismatch.
 */
export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  function toggle() {
    setTheme(isDark ? 'light' : 'dark');
  }

  if (variant === 'full') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggle}
        className={cn('w-full justify-start gap-2 text-muted-foreground', className)}
        aria-label="Alternar tema"
      >
        <span className="relative inline-flex h-4 w-4 items-center justify-center">
          <Sun
            className={cn(
              'absolute h-4 w-4 transition-all duration-300',
              isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
            )}
          />
          <Moon
            className={cn(
              'absolute h-4 w-4 transition-all duration-300',
              isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0',
            )}
          />
        </span>
        {mounted ? (isDark ? 'Modo claro' : 'Modo oscuro') : 'Tema'}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={cn('relative h-9 w-9', className)}
      aria-label="Alternar tema"
    >
      <Sun
        className={cn(
          'absolute h-4 w-4 transition-all duration-300',
          isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
        )}
      />
      <Moon
        className={cn(
          'absolute h-4 w-4 transition-all duration-300',
          isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0',
        )}
      />
    </Button>
  );
}
