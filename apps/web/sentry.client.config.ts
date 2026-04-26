/**
 * Sentry browser / client-side configuration.
 * This file is automatically loaded by @sentry/nextjs for client bundles.
 * It is safe to import client-only APIs here.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? 'development',

  // Capture 10% of user sessions for performance monitoring in production.
  // Set to 1.0 during initial rollout to profile all sessions, then tune down.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // Replay 10% of sessions, 100% of sessions with an error.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Disabled when DSN is absent (local dev, CI)
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media in replays for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
