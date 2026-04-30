'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Error boundary for the dashboard segment. Catches errors thrown by any
 * page or layout under (dashboard)/ and renders a friendly retry UI.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the console so it's still visible in dev tools.
    // In production this is also captured by Sentry through the global handler.
    console.error('[dashboard error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive ring-1 ring-destructive/20">
              <AlertOctagon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <CardTitle>Algo salió mal</CardTitle>
              <CardDescription className="mt-1">
                Ocurrió un error inesperado al cargar esta página. Probá
                reintentar — si persiste, revisá tu conexión o avisanos.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show error message in dev only — never expose stack traces in prod UX. */}
          {process.env.NODE_ENV !== 'production' && error.message && (
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs font-mono leading-relaxed text-muted-foreground">
              {error.message}
            </pre>
          )}
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Código de referencia:{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                {error.digest}
              </code>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={reset} className="gap-2">
              <RotateCcw className="size-4" />
              Reintentar
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <Home className="size-4" />
                Volver al dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
