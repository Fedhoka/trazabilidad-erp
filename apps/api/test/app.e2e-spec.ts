/**
 * E2E test suite — requires a running PostgreSQL instance.
 *
 * Before running:
 *   psql -U trazabilidad -c "CREATE DATABASE trazabilidad_test;"
 *   pnpm --filter api test:e2e
 *
 * The suite uses the real NestJS application (full DI, real DB, HTTP via
 * Supertest).  Migrations run automatically in beforeAll.  The `tenants`
 * table is truncated (cascades to all tenant-scoped tables) before each
 * top-level describe block so tests are fully isolated.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

// ─── App bootstrap ────────────────────────────────────────────────────────────

async function createApp(): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication({ logger: false });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();

  // Apply any pending migrations so the schema is always up-to-date.
  const ds = app.get(DataSource);
  await ds.runMigrations();

  return app;
}

async function cleanDb(app: INestApplication): Promise<void> {
  const ds = app.get(DataSource);
  // Cascades to all tenant-scoped tables (users, suppliers, materials, etc.)
  await ds.query(`TRUNCATE tenants RESTART IDENTITY CASCADE`);
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

async function registerTenant(
  app: INestApplication,
  tenantName: string,
  email: string,
  password = 'TestPass123!',
): Promise<Tokens> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/register-tenant')
    .send({ tenantName, ownerEmail: email, ownerPassword: password })
    .expect(201);
  return res.body as Tokens;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

let app: INestApplication<App>;

beforeAll(async () => {
  app = await createApp();
});

afterAll(async () => {
  await cleanDb(app).catch(() => undefined);
  await app.close();
});

// ─── Health ───────────────────────────────────────────────────────────────────

describe('GET /api/v1/health', () => {
  it('returns 200 without any auth token', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
  });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe('Auth endpoints', () => {
  beforeAll(() => cleanDb(app));

  it('POST /auth/register-tenant → 201 with accessToken + refreshToken', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register-tenant')
      .send({
        tenantName: 'Auth Test Corp',
        ownerEmail: 'owner@authtest.com',
        ownerPassword: 'TestPass123!',
      })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(typeof res.body.accessToken).toBe('string');
  });

  it('POST /auth/register-tenant → 400 when slug already exists', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register-tenant')
      .send({
        tenantName: 'Auth Test Corp', // same slug as above
        ownerEmail: 'other@authtest.com',
        ownerPassword: 'TestPass123!',
      })
      .expect(400);
  });

  it('POST /auth/login → 201 with valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'owner@authtest.com', password: 'TestPass123!' })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
  });

  it('POST /auth/login → 401 with wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'owner@authtest.com', password: 'wrongpassword' })
      .expect(401);
  });

  it('POST /auth/login → 401 when user does not exist', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'pass' })
      .expect(401);
  });

  it('POST /auth/forgot-password → 204 for registered email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'owner@authtest.com' })
      .expect(204);
  });

  it('POST /auth/forgot-password → 204 for UNKNOWN email (no enumeration)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'doesnotexist@x.com' })
      .expect(204);
  });

  it('POST /auth/forgot-password → 400 when email is not valid', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  it('POST /auth/reset-password → 400 with invalid token', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ token: 'totally-fake-token', newPassword: 'NewPass123!' })
      .expect(400);
  });
});

// ─── Suppliers ────────────────────────────────────────────────────────────────

describe('Suppliers endpoints', () => {
  let token: string;

  beforeAll(async () => {
    await cleanDb(app);
    const tokens = await registerTenant(
      app,
      'Supplier Test Corp',
      'owner@suppliertest.com',
    );
    token = tokens.accessToken;
  });

  it('GET /suppliers → 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/v1/suppliers').expect(401);
  });

  it('GET /suppliers → 200 with empty data on fresh tenant', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 25 });
  });

  it('POST /suppliers → 201 creates a supplier', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ACME Supplies', cuit: '20-12345678-9' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('ACME Supplies');
  });

  it('GET /suppliers → 200 returns the created supplier in data array', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.some((s: { name: string }) => s.name === 'ACME Supplies')).toBe(true);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('POST /suppliers → 400 when name is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({ cuit: '20-00000000-0' }) // no name
      .expect(400);
  });
});

// ─── Audit log ────────────────────────────────────────────────────────────────

describe('Audit log endpoint', () => {
  let token: string;

  beforeAll(async () => {
    await cleanDb(app);
    // Register a tenant and create a supplier so there is at least one audit entry
    const tokens = await registerTenant(app, 'Audit Test Corp', 'owner@auditcorp.com');
    token = tokens.accessToken;

    await request(app.getHttpServer())
      .post('/api/v1/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Logged Supplier' });
  });

  it('GET /audit-logs → 401 without token', async () => {
    await request(app.getHttpServer()).get('/api/v1/audit-logs').expect(401);
  });

  it('GET /audit-logs → 200 paginated for OWNER', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    // At minimum the POST /suppliers above should have been logged
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });
});
