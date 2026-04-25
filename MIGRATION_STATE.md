# Migration State — Trazabilidad ERP

**Project root**: `C:\Users\catal\OneDrive\Escritorio\PROYECTOS\trazabilidad`
**Last updated**: 2026-04-25
**Current phase**: 🔜 Stage 6

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
- ✅ **Stage 5** — Production + Traceability
  - RecipesService (create with components in tx, DRAFT→ACTIVE→ARCHIVED), RecipesController
  - ProductionOrdersService: create (MAX(number)+1, theoretical cost = Σ qtyPerBatch × scale × (1+loss%) × avgCost), start, recordConsumption (pessimistic lock on lot, deduct, CONSUMED when 0), complete (actual cost from consumptions, FinishedLot, avg_cost recompute), cancel
  - TraceabilityService: backward/forward/full with raw SQL CTEs via json_agg
  - Build clean.
- 🔜 **Stage 6** — Customers + Sales + Fiscal (mock)
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
- @nestjs/jwt@11 branded StringValue type → cast as any.
- dotenv added as runtime dep.

## Last verification commands

Stage 5: `pnpm build` in apps/api → compiled clean.
