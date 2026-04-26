/**
 * Sentry Edge Runtime configuration (middleware, edge API routes).
 * The Edge runtime does not support all Node.js APIs — keep this minimal.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 0,
  enabled: !!process.env.SENTRY_DSN,
});
