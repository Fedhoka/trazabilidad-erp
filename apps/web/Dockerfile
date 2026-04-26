# syntax=docker/dockerfile:1

# ── Stage 1: install all workspace deps ──────────────────────────────────────
FROM node:20-alpine AS installer
WORKDIR /repo
RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM installer AS builder
COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter web build

# Produce a self-contained deploy dir
RUN pnpm deploy --filter web --prod /prod/web

# ── Stage 3: slim runtime image ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /prod/web/node_modules  ./node_modules
COPY --from=builder /repo/apps/web/.next    ./.next
COPY --from=builder /repo/apps/web/public   ./public
COPY --from=builder /repo/apps/web/package.json ./package.json

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
