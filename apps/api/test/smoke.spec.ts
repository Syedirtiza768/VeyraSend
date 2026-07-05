import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { Tenant } from '@veyrasend/db';

/**
 * Phase 11 — fresh-environment smoke. Boots the full app against the migrated
 * database, verifies the health endpoint, the CSRF + login flow, and that every
 * tenant-scoped module route is mounted (200, not 404) for an authenticated
 * owner. This is the handoff gate: green means the system wires end-to-end.
 */
describe('Phase 11 — fresh-env smoke', () => {
  let app: INestApplication;
  let ds: DataSource;
  let redisClient: { quit: () => Promise<void> };
  let tenantId: string;
  let ownerEmail: string;
  const ownerPassword = 'smoke-owner-password-123';

  beforeAll(async () => {
    const config = new ConfigService();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api', { exclude: ['health', 'health/*'] });
    redisClient = applyHttpMiddleware(app, config.all) as unknown as { quit: () => Promise<void> };
    await app.init();
    ds = app.get('DATA_SOURCE' as never) as DataSource;
    const tenants = app.get(TenantsService);
    const suffix = Math.random().toString(36).slice(2, 10);
    ownerEmail = `smoke-owner-${suffix}@test.veyrasend`;
    const a = await tenants.createTenantWithOwner({ name: `Smoke ${suffix}`, slug: `smoke-${suffix}`, ownerEmail, ownerPassword, ownerName: 'Smoke' });
    tenantId = a.tenant.id;
  });

  afterAll(async () => {
    if (ds) await ds.getRepository(Tenant).delete([tenantId]);
    if (app) await app.close();
    if (redisClient) await redisClient.quit();
  });

  function agent() { return supertest.agent(app.getHttpServer()); }

  it('health endpoint reports ok', async () => {
    const res = await supertest(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });

  it('CSRF token is issued', async () => {
    const a = agent();
    const res = await a.get('/api/auth/csrf').expect(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  it('owner can log in and every module route is mounted', async () => {
    const a = agent();
    const csrf = (await a.get('/api/auth/csrf').expect(200)).body.token;
    await a.post('/api/auth/login').set('x-csrf-token', csrf).send({ email: ownerEmail, password: ownerPassword }).expect(200);

    const routes = [
      '/api/auth/me',
      '/api/templates',
      '/api/contacts',
      '/api/lists',
      '/api/segments',
      '/api/suppressions',
      '/api/campaigns',
      '/api/automations',
      '/api/messages',
      '/api/events',
      '/api/inbound/threads',
      '/api/analytics/overview',
      '/api/analytics/timeseries',
      '/api/usage',
      '/api/settings',
      '/api/audit',
      '/api/users',
      '/api/sendgrid/status',
    ];
    for (const r of routes) {
      const res = await a.get(r);
      if (res.status !== 200) {
        throw new Error(`GET ${r} returned ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`);
      }
    }
  });

  it('unauthenticated requests to a protected route are rejected', async () => {
    const res = await supertest(app.getHttpServer()).get('/api/templates');
    expect([401, 403]).toContain(res.status);
  });
});
