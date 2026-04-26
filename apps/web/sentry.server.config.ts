/**
 * Sentry server-side (Node.js / Next.js server) configuration.
 * Loaded automatically for SSR, API routes, and Server Components.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 0,
  enabled: !!process.env.SENTRY_DSN,
});
