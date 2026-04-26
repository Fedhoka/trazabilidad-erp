# syntax=docker/dockerfile:1

# ── Stage 1: install all workspace deps ──────────────────────────────────────
FROM node:20-alpine AS installer
WORKDIR /repo
RUN corepack enable

# Copy manifest files first so layer is cached unless deps change
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM installer AS builder
COPY apps/api ./apps/api

RUN pnpm --filter api build

# Produce a self-contained deploy dir (resolves workspace symlinks)
RUN pnpm deploy --filter api --prod /prod/api

# ── Stage 3: slim runtime image ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Only copy what the app needs at runtime
COPY --from=builder /prod/api/node_modules ./node_modules
COPY --from=builder /repo/apps/api/dist     ./dist

EXPOSE 4000

CMD ["node", "dist/main"]
