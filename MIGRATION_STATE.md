# Migration State — Trazabilidad ERP

**Project root**: `C:\Users\catal\OneDrive\Escritorio\PROYECTOS\trazabilidad`
**Last updated**: 2026-04-25
**Current phase**: 🔜 Stage 3

## Legend
- 🔜 NEXT — about to execute
- 🚧 IN PROGRESS — started, not finished
- ✅ DONE — completed and verified
- ⏸️ BLOCKED — waiting on external input

## Stages

- ✅ **Stage 1** — Monorepo scaffolding
  - Root files, NestJS apps/api, Next.js apps/web + shadcn (12 components). Both build clean.
- ✅ **Stage 2** — Auth + Tenants + Users
  - main.ts (ValidationPipe, /api/v1, CORS), app.module.ts (global guards), common decorators/guards/base entity, users/tenants/auth modules. Build clean (expiresIn cast as any for StringValue branded type).
- 🔜 **Stage 3** — Full DB schema + migration
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

- Docker Desktop not installed; apps verified via pnpm build.
- pnpm dlx has a local cache bug; npx used as workaround.
- @nestjs/jwt@11 uses branded StringValue type for expiresIn — cast as any in auth.module.ts and auth.service.ts.

## Last verification commands

Stage 2: `pnpm build` in apps/api → compiled clean, no errors.
