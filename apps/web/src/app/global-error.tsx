'use client';

import { useEffect } from 'react';

/**
 * Last-resort error boundary at the root of the application. Catches errors
 * thrown by the root layout itself (where the dashboard error.tsx can't
 * reach). Must render its own <html> and <body> per Next.js convention.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global error]', error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#fff',
          color: '#111',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>
            Algo se rompió
          </h1>
          <p style={{ margin: '0 0 1.5rem', color: '#555' }}>
            La aplicación encontró un error grave. Reintentar suele resolverlo.
          </p>
          {error.digest && (
            <p
              style={{
                margin: '0 0 1.5rem',
                color: '#888',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
              }}
            >
              Ref: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#2f6f4f',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
