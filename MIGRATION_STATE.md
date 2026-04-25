# Migration State — Trazabilidad ERP

**Project root**: `C:\Users\catal\OneDrive\Escritorio\PROYECTOS\trazabilidad`
**Last updated**: 2026-04-25
**Current phase**: 🔜 Stage 5

## Legend
- 🔜 NEXT — about to execute
- 🚧 IN PROGRESS — started, not finished
- ✅ DONE — completed and verified
- ⏸️ BLOCKED — waiting on external input

## Stages

- ✅ **Stage 1** — Monorepo scaffolding
- ✅ **Stage 2** — Auth + Tenants + Users
- ✅ **Stage 3** — Full DB schema + migration
- ✅ **Stage 4** — Suppliers + Materials + Procurement + Receipts
  - SuppliersService/Controller (CRUD), MaterialsService/Controller (CRUD + code uniqueness)
  - ProcurementService (PO create with MAX(number)+1 sequence, approve, cancel state machine)
  - GoodsReceiptsService (full transaction: lot creation, QC→status mapping, expiresOn from shelfLifeDays, avg_cost recompute)
  - Build clean.
- 🔜 **Stage 5** — Production + Traceability
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
- @nestjs/jwt@11 uses branded StringValue type for expiresIn — cast as any.
- dotenv added as runtime dep for data-source.ts CLI usage.

## Last verification commands

Stage 4: `pnpm build` in apps/api → compiled clean.
