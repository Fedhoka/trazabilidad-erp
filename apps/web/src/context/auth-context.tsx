'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  decodeJwt,
} from '@/lib/auth';


export interface AuthUser {
  id: string;
  email: string;
  role: string;
  tenantId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerTenant: (tenantName: string, ownerEmail: string, ownerPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromToken(token: string): AuthUser | null {
  const p = decodeJwt(token);
  if (!p) return null;
  return { id: p.sub, email: p.email, role: p.role, tenantId: p.tenantId };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) setUser(userFromToken(token));
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setTokens(data.accessToken, data.refreshToken);
    setUser(userFromToken(data.accessToken));
  }, []);

  const registerTenant = useCallback(
    async (tenantName: string, ownerEmail: string, ownerPassword: string) => {
      const data = await apiFetch<{ accessToken: string; refreshToken: string }>(
        '/auth/register-tenant',
        {
          method: 'POST',
          body: JSON.stringify({ tenantName, ownerEmail, ownerPassword }),
        },
      );
      setTokens(data.accessToken, data.refreshToken);
      setUser(userFromToken(data.accessToken));
    },
    [],
  );

  const logout = useCallback(() => {
    // Fire-and-forget: revoke refresh token on the server, then clear client state
    const refresh = getRefreshToken();
    if (refresh) {
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
      fetch(`${base}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken() ?? ''}`,
        },
        body: JSON.stringify({ refreshToken: refresh }),
      }).catch(() => undefined);
    }
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, registerTenant, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { getRefreshToken };
