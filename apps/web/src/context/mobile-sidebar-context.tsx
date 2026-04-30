'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface MobileSidebarContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextValue | null>(null);

/**
 * Tracks whether the sidebar drawer is open on mobile viewports. Desktop
 * (md+) ignores this state because the sidebar is always visible there.
 */
export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <MobileSidebarContext.Provider value={{ open, toggle, close }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

export function useMobileSidebar(): MobileSidebarContextValue {
  const ctx = useContext(MobileSidebarContext);
  if (!ctx) throw new Error('useMobileSidebar must be used within MobileSidebarProvider');
  return ctx;
}
