# Migration State — Trazabilidad ERP

**Project root**: `C:\Users\catal\OneDrive\Escritorio\PROYECTOS\trazabilidad`
**Last updated**: 2026-04-25
**Current phase**: 🔜 Stage 4

## Legend
- 🔜 NEXT — about to execute
- 🚧 IN PROGRESS — started, not finished
- ✅ DONE — completed and verified
- ⏸️ BLOCKED — waiting on external input

## Stages

- ✅ **Stage 1** — Monorepo scaffolding
  - Root files, NestJS apps/api, Next.js apps/web + shadcn (12 components). Both build clean.
- ✅ **Stage 2** — Auth + Tenants + Users
  - main.ts, app.module.ts (global guards), common decorators/guards/base entity, users/tenants/auth modules. Build clean.
- ✅ **Stage 3** — Full DB schema + migration
  - data-source.ts + migration scripts in package.json. 30 entities across 9 modules (suppliers, materials, inventory, procurement, production, sales, fiscal + users/tenants). Two migrations: 1714000000000-Init (20 tables) + 1714000100000-PointsOfSaleAndCounters (4 tables). Build clean.
- 🔜 **Stage 4** — Suppliers + Materials + Procurement + Receipts
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

- Docker Desktop not installed; apps verified via pnpm build. Run `pnpm infra:up` then `pnpm migration:run` once Docker is available.
- pnpm dlx has a local cache bug; npx used as workaround.
- @nestjs/jwt@11 uses branded StringValue type for expiresIn — cast as any in auth.module.ts and auth.service.ts.
- dotenv added as runtime dep (needed by data-source.ts for CLI usage).

## Last verification commands

Stage 3: `pnpm build` in apps/api → compiled clean, no errors (35 files).
