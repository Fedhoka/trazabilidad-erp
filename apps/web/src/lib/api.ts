import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data: { accessToken: string; refreshToken: string } = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

function buildHeaders(token: string | null, extra?: HeadersInit): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let token = getAccessToken();

  const run = (t: string | null) =>
    fetch(`${BASE}${path}`, { ...init, headers: buildHeaders(t, init?.headers) });

  let res = await run(token);

  if (res.status === 401) {
    if (!refreshPromise) {
      refreshPromise = attemptRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    token = await refreshPromise;
    if (!token) throw new ApiError(401, 'Session expired');
    res = await run(token);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = Array.isArray(body?.message) ? body.message.join(', ') : (body?.message ?? res.statusText);
    throw new ApiError(res.status, msg);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function downloadReport(path: string, filename: string): Promise<void> {
  const blob = await apiFetchBlob(path);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function apiFetchBlob(path: string): Promise<Blob> {
  let token = getAccessToken();
  const run = (t: string | null) =>
    fetch(`${BASE}${path}`, {
      headers: t ? { Authorization: `Bearer ${t}` } : undefined,
    });

  let res = await run(token);

  if (res.status === 401) {
    if (!refreshPromise) {
      refreshPromise = attemptRefresh().finally(() => { refreshPromise = null; });
    }
    token = await refreshPromise;
    if (!token) throw new ApiError(401, 'Session expired');
    res = await run(token);
  }

  if (!res.ok) throw new ApiError(res.status, res.statusText);
  return res.blob();
}
