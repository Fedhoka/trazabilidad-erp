# Migration State — Trazabilidad ERP

**Project root**: `C:\Users\catal\OneDrive\Escritorio\PROYECTOS\trazabilidad`
**Last updated**: 2026-04-26
**Current phase**: ✅ Stage 18 complete

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
- ✅ **Stage 6** — Customers + Sales + Fiscal (mock)
  - CustomersService/Controller (CUIT uniqueness guard), SalesOrdersService/Controller (MAX(number)+1 tx, DRAFT→CONFIRMED→INVOICED), SalesModule wired
  - PointsOfSaleService/Controller, InvoicesService (type A for RI / B for others, IVA breakdown by rate, atomic fiscal_counter UPSERT, MockFiscalProvider selected by AFIP_ENV=mock), InvoicesController, FiscalModule with factory provider
  - `import type` fix for IFiscalProvider interface under isolatedModules+emitDecoratorMetadata
  - Build clean.
- ✅ **Stage 7a** — Frontend foundation + auth + dashboard
  - lib/auth.ts (token storage + JWT decode), lib/api.ts (fetch wrapper with silent refresh)
  - AuthProvider (context), Providers (QueryClient + Auth + Toaster), root layout updated
  - (auth) route group: login + register pages with react-hook-form + zod
  - (dashboard) route group: auth-guard layout, sidebar with nav, dashboard overview
  - Build clean: /login, /register, /dashboard all prerendered.
- ✅ **Stage 7b** — Frontend suppliers + materials
  - hooks/use-suppliers.ts + hooks/use-materials.ts (TanStack Query CRUD hooks)
  - /suppliers page: table + create/edit Dialog (null→undefined defaultValues fix)
  - /materials page: table + create/edit Dialog with Select for MaterialKind (shelfLifeDays as string field to avoid Zod union resolver bug)
  - Build clean: 7 routes.
- ✅ **Stage 7c** — Frontend procurement + receipts
  - hooks/use-procurement.ts (usePurchaseOrders, usePurchaseOrder, useCreatePurchaseOrder, useApprovePO, useCancelPO, useCreateGoodsReceipt)
  - /procurement page: PO list table + create dialog with dynamic lines (useFieldArray) and supplier/material selects
  - /procurement/[id] page: PO detail with approve/cancel actions + inline receipt registration form (per-line lot/qty/cost/QC/vencimiento)
  - Fix: Select onValueChange typed string|null → guarded with v && setter
  - Build clean: 9 routes.
- ✅ **Stage 7d** — Frontend customers + sales + invoice
  - hooks/use-customers.ts, use-sales.ts, use-fiscal.ts
  - /customers: CRUD table + dialog with CondicionIva select
  - /sales-orders: list + create dialog with dynamic lines; /sales-orders/[id]: confirm/cancel + "Emitir factura" dialog (pre-fills lines from SO, POS select, IVA rate per line)
  - /fiscal: POS management table + create dialog; full invoice list with CAE
  - Fix: z.coerce.number → string field + parseInt (Zod v4 resolver incompatibility)
  - Build clean: 13 routes.
- ✅ **Stage 7e** — Frontend production + traceability
  - hooks/use-production.ts (recipes, production orders, traceability)
  - /production: tabbed page — Recetas (list + create dialog with dynamic components + activate/archive actions) | Órdenes (list + create dialog)
  - /production/orders/[id]: detail with start/cancel (DRAFT), record consumption + complete form (IN_PROGRESS)
  - /production/traceability: lot UUID search → full traceability JSON viewer
  - Fix: useTraceability returns unknown → !!data guard in JSX
  - Build clean: 16 routes.
- ✅ **Stage 8** — Demo seeder
  - `apps/api/src/database/seed.ts`: standalone DataSource seeder, double-seed guard, full E2E dataset
  - Tenant: La Empanada Gourmet / admin@empanada.com / Demo1234!
  - 2 suppliers, 7 materials, 1 location, 2 POs+GRs, 5 material lots, 2 recipes, 2 completed POs with finished lots, 1 customer (RI), 1 POS, 1 SO (INVOICED), 1 Invoice (Type A, mock CAE)
  - Run: `pnpm --filter api seed` (after `pnpm migration:run` with DB running)
  - Build clean.
- ✅ **Stage 9** — Real AFIP (WSAA + WSFEv1)
  - `wsaa.service.ts`: LoginTicketRequest XML → PKCS#7 CMS sign (node-forge SHA-256) → WSAA SOAP `loginCms` → token+sign cache (12 h − 5 min buffer)
  - `arca-fiscal.provider.ts`: `WsaaService` + WSFEv1 `FECAESolicitar`; A→cbteTipo 1, B→6, C→11; AlicIva IDs mapped (0%=3, 10.5%=4, 21%=5, 27%=6)
  - Factory in `fiscal.module.ts`: reads `AFIP_CERT_PATH`, `AFIP_KEY_PATH`, `AFIP_CUIT`, `AFIP_ENV` via ConfigService; mock stays default
  - Activate: `AFIP_ENV=homologacion` (or `produccion`) + set the three cert env vars
  - Build clean.
- ✅ **Stage 10** — Dashboard KPIs + Inventory stock view
  - `DashboardModule`: `GET /dashboard/kpis` — 7 aggregate metrics (lots, stock value, open POs/SOs, production, monthly invoices)
  - `InventoryService/Controller`: `GET /inventory/lots` — active lots with material + location JOIN, ordered by expiry
  - Frontend: `/dashboard` live KPI cards + quick-nav; `/inventory` expiry-colour-coded table; sidebar "Inventario" added
  - Build clean: API + web (17 routes).
- ✅ **Stage 11** — PDF invoice (comprobante)
  - `InvoicePdfService`: pdfkit layout + qrcode QR per AFIP RG 5259; issuer name from tenants table, CUIT from `AFIP_CUIT` env, address from `COMPANY_ADDRESS` env
  - `GET /invoices/:id/pdf` → `StreamableFile(application/pdf)` with `Content-Disposition: attachment`
  - Frontend: `apiFetchBlob` helper in `lib/api.ts`; `/fiscal` invoices table → `FileDown` icon triggers authenticated blob download
  - Build clean: API + web (17 routes).
- ✅ **Stage 12** — Reports & CSV exports
  - `ReportsModule`: 4 authenticated CSV endpoints — `GET /reports/stock.csv`, `invoices.csv`, `production-costs.csv`, `purchases.csv`
  - UTF-8 BOM prepended so Excel opens correctly; all amounts formatted to 2–4 decimals
  - Frontend: `downloadReport()` helper in `lib/api.ts`; "Exportar CSV" buttons on `/inventory`, `/fiscal`, `/production`, `/procurement`
  - Build clean: API + web (17 routes).
- ✅ **Stage 13** — User management
  - `UsersService`: `findAllByTenant`, `invite` (argon2 hash), `updateRole`, `setActive`; `passwordHash` stripped from all responses
  - `UsersController`: `GET /users`, `POST /users` (@Roles OWNER), `PATCH /users/:id/role` (@Roles OWNER), `PATCH /users/:id/activate|deactivate` (@Roles OWNER)
  - Frontend: `hooks/use-users.ts`; `/users` page — table with inline role `<Select>` (OWNER only), activate/deactivate toggle, invite dialog; self-row deactivation guarded by `u.id !== currentUser.id`
  - Sidebar + dashboard quick-nav updated with "Usuarios" entry
  - Build clean: API + web (18 routes).
- ✅ **Stage 14** — Swagger docs + .env.example + lot QC actions
  - `@nestjs/swagger` wired in `main.ts`; CLI plugin enabled in `nest-cli.json` (auto-generates from TS types); docs at `GET /api/docs`
  - `apps/api/.env.example` and `apps/web/.env.example` created with all required vars and inline comments
  - `PATCH /inventory/lots/:id/status` (@Roles OWNER|QC|PROCUREMENT) — transition QUARANTINE↔AVAILABLE↔BLOCKED; guards against CONSUMED/EXPIRED
  - Frontend: `/inventory` page gets per-row "Acción" dropdown with context-sensitive transitions; `useUpdateLotStatus` hook invalidates both lots and KPI queries
  - Build clean: API + web (18 routes).
- ✅ **Stage 15** — Redis refresh-token blacklist
  - `RedisService` (@Global): ioredis with `lazyConnect`, graceful degradation (blocklist skipped if Redis is absent, warning logged)
  - `AuthService.logout(token)`: SHA-256 hashes the refresh token, stores in Redis with TTL = remaining token lifetime (`rt:bl:` prefix)
  - `AuthService.refresh(token)`: checks Redis blocklist before verifying; rejects with 401 if blocked
  - `POST /auth/logout` (authenticated, 204): accepts `refreshToken` in body, calls `logout()`
  - Frontend `AuthContext.logout()`: fire-and-forget POST to `/auth/logout` with current refresh token before clearing localStorage
  - `.env.example` updated with `REDIS_HOST` / `REDIS_PORT`
  - Build clean: API + web (18 routes).
- ✅ **Stage 16** — Change password
  - `POST /users/me/change-password` (204): verifies current password with argon2, hashes and saves new one
  - Frontend: `useChangePassword` hook; `ChangePasswordSection` on `/users` page with current + new + confirm fields, Zod match validation
  - Build clean: API + web (18 routes).

- ✅ **Stage 17** — Automated lot expiry scheduler
  - `@nestjs/schedule` installed; `ScheduleModule.forRoot()` registered in `AppModule`
  - `LotExpiryService`: `@Cron(EVERY_HOUR)` → bulk UPDATE AVAILABLE/QUARANTINE lots past `expires_on` → EXPIRED; logs count
  - `SchedulerModule` registered in `AppModule`
  - `InventoryService`: `findLots(tenantId, includeExpired?)` + new `expiringSoon(tenantId, days=7)`
  - `InventoryController`: `GET /inventory/lots?includeExpired=true`, `GET /inventory/expiring-soon`
  - `DashboardService`: added `expiring_soon` subquery (lots expiring within 7 days) → `expiringSoon` in KPI response
  - Frontend: `DashboardKpis` + `useInventoryLots(includeExpired)` + `useExpiringSoon()` hook
  - `/dashboard`: "Lotes por vencer (7 d)" KPI card with AlertTriangle icon
  - `/inventory`: status-filter tab bar (Todos / Disponible / Cuarentena / Bloqueado / Vencido) with per-tab counts; EXPIRED rows shown at 50% opacity; `includeExpired` only fetched when needed
  - Build clean: API + web (17 routes).

- ✅ **Stage 18** — Docker + Compose
  - `apps/api/Dockerfile`: 3-stage build (installer → builder with `nest build` + `pnpm deploy` → slim node:20-alpine runner)
  - `apps/web/Dockerfile`: same pattern — `next build` + `pnpm deploy` → runner with `next start`
  - `apps/api/.dockerignore` + `apps/web/.dockerignore`
  - `docker-compose.yml`: full stack — postgres:16 + redis:7 + api + web; healthchecks on infra; api env overrides `DB_HOST=postgres` / `REDIS_HOST=redis`
  - `docker-compose.infra.yml`: postgres + redis only — used by `pnpm infra:up` during local dev
  - Root scripts: `infra:up/down` → infra-only; `app:up/down/logs` → full stack
  - API build clean.

## Notes / blockers / decisions

- Docker Desktop not installed; apps verified via pnpm build.
- pnpm dlx has a local cache bug; npx used as workaround.
- @nestjs/jwt@11 branded StringValue type → cast as any.
- dotenv added as runtime dep.

## Last verification commands

Stage 5: `pnpm build` in apps/api → compiled clean.
Stage 6: `pnpm build` in apps/api → compiled clean.
Stage 7a: `pnpm build` in apps/web → compiled clean, 5 routes.
Stage 8: `pnpm build` in apps/api → compiled clean.
Stage 9: `pnpm build` in apps/api → compiled clean.
Stage 10: `pnpm build` in apps/api + apps/web → compiled clean, 17 routes.
Stage 11: `pnpm build` in apps/api + apps/web → compiled clean, 17 routes.
Stage 12: `pnpm build` in apps/api + apps/web → compiled clean, 17 routes.
Stage 13: `pnpm build` in apps/api + apps/web → compiled clean, 18 routes.
Stage 14: `pnpm build` in apps/api + apps/web → compiled clean, 18 routes.
Stage 15: `pnpm build` in apps/api + apps/web → compiled clean, 18 routes.
Stage 16: `pnpm build` in apps/api + apps/web → compiled clean, 18 routes.
Stage 17: `pnpm build` in apps/api + apps/web → compiled clean, 17 routes.
Stage 18: `nest build` in apps/api → clean. Docker files created; full build requires Docker daemon.
