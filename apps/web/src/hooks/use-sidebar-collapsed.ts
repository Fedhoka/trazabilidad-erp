'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'trz:sidebar:collapsed';

/**
 * Tracks the sidebar collapsed state and persists it to localStorage.
 * Hydration-safe: returns `false` on the server / first render, then syncs
 * to the stored value on mount.
 */
export function useSidebarCollapsed(): {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
  hydrated: boolean;
} {
  const [collapsed, setCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === '1') setCollapsedState(true);
    } catch {
      /* localStorage unavailable — keep default */
    }
    setHydrated(true);
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      /* ignore quota / privacy mode errors */
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { collapsed, toggle, setCollapsed, hydrated };
}
