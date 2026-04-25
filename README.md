# Trazabilidad

Vertical ERP for Argentine frozen-food producers (tequeños, empanadas, etc).

## Stack
- Backend: NestJS 10 + TypeORM + PostgreSQL 16
- Frontend: Next.js 15 + Tailwind + shadcn/ui

## Dev setup
```
pnpm i
pnpm infra:up
cd apps/api && pnpm migration:run && cd ../..
pnpm dev:api    # http://localhost:4000
pnpm dev:web    # http://localhost:3000
```
