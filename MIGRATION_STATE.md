# Migration State — Trazabilidad ERP

**Project root**: `C:\Users\catal\OneDrive\Escritorio\PROYECTOS\trazabilidad`
**Last updated**: 2026-04-25
**Current phase**: 🔜 Stage 2

## Legend
- 🔜 NEXT — about to execute
- 🚧 IN PROGRESS — started, not finished
- ✅ DONE — completed and verified
- ⏸️ BLOCKED — waiting on external input

## Stages

- ✅ **Stage 1** — Monorepo scaffolding
  - Root files created (pnpm-workspace, package.json, docker-compose, .env, .gitignore, .nvmrc, README)
  - NestJS app scaffolded at apps/api with all deps; Next.js 15 at apps/web with shadcn/ui (12 components)
- 🔜 **Stage 2** — Auth + Tenants + Users
- ⬜ Stage 3 — Full DB schema + migration
- ⬜ Stage 4 — Suppliers + Materials + Procurement + Receipts
- ⬜ Stage 5 — Production + Traceability
- ⬜ Stage 6 — Customers + Sales + Fiscal (mock)
- ⬜ Stage 7a — Frontend foundation + auth + dashboard
- ⬜ Stage 7b — Frontend suppliers + materials
- ⬜ Stage 7c — Frontend procurement + receipts
- ⬜ Stage 7d — Frontend customers + sales + invoice
- ⬜ Stage 7e — Frontend production + traceability
- ⬜ Stage 8 — Demo seeder
- ⏸️ Stage 9 — Real AFIP (WSAA + WSFEv1) — blocked until homologation cert available

## Notes / blockers / decisions

- Docker Desktop not installed on this machine. `docker compose up -d` will need to be run manually once Docker is installed. Both apps verified via `pnpm build` instead.
- pnpm dlx has a local cache bug; npx used as workaround for @nestjs/cli and create-next-app.

## Last verification commands

Stage 1:
- `pnpm build` in apps/api → compiled successfully (dist/ created)
- `pnpm build` in apps/web → compiled successfully, static pages generated
