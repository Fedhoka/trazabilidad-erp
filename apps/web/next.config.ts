import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Next.js 16 enables Turbopack by default for builds.
  // Sentry's webpack plugin cannot run under Turbopack, so source-map uploads
  // are handled separately (via SENTRY_AUTH_TOKEN in CI).  Adding an explicit
  // turbopack key tells Next.js we are aware of the webpack/Turbopack split
  // and suppresses the build error.
  turbopack: {},
};

// Sentry build-time configuration (Sentry SDK v8 API).
// When SENTRY_AUTH_TOKEN is absent (dev / CI without secrets), source-map
// uploads are automatically skipped — no extra flags needed.
export default withSentryConfig(nextConfig, {
  // Organisation and project slugs from your Sentry dashboard.
  // Used only during the build to upload source maps to Sentry.
  org: process.env.SENTRY_ORG ?? "",
  project: process.env.SENTRY_PROJECT ?? "",

  // Auth token for source map upload (set in CI/CD secrets, not committed).
  // Source map upload is automatically skipped when this is absent.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Silences the Sentry CLI output during builds (set to false to debug).
  silent: true,

  // Hide source maps from the client bundle (serve them only to Sentry).
  hideSourceMaps: true,

  // Tree-shake Sentry logger calls in production to reduce bundle size.
  disableLogger: true,

  // Do not set up Vercel Cron monitors (we are not using Vercel).
  automaticVercelMonitors: false,
});
