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

/** Phase 8 automations API — read-only since Phase 15 (see workflows-phase.spec.ts for E2E). */
describe('Phase 8 — automations (read-only legacy API)', () => {
  let app: INestApplication;
  let tenants: TenantsService;
  let ds: DataSource;
  let redisClient: { quit: () => Promise<void> };
  let tenantAId: string;
  let aOwnerEmail: string;

  beforeAll(async () => {
    const config = new ConfigService();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api', { exclude: ['health', 'health/*'] });
    redisClient = applyHttpMiddleware(app, config.all) as unknown as { quit: () => Promise<void> };
    await app.init();
    tenants = app.get(TenantsService);
    ds = app.get('DATA_SOURCE' as never) as DataSource;

    const suffix = Math.random().toString(36).slice(2, 10);
    aOwnerEmail = `a8-owner-${suffix}@test.veyrasend`;
    const a = await tenants.createTenantWithOwner({
      name: `A8 ${suffix}`, slug: `a8-${suffix}`, ownerEmail: aOwnerEmail,
      ownerPassword: 'a8-owner-password-123', ownerName: 'A8',
    });
    tenantAId = a.tenant.id;
  });

  afterAll(async () => {
    if (ds) await ds.getRepository(Tenant).delete([tenantAId]);
    if (app) await app.close();
    if (redisClient) await redisClient.quit();
  });

  function agent() { return supertest.agent(app.getHttpServer()); }
  async function loginAs(email: string, password: string) {
    const a = agent();
    const csrf = (await a.get('/api/auth/csrf').expect(200)).body.token;
    await a.post('/api/auth/login').set('x-csrf-token', csrf).send({ email, password }).expect(200);
    return a;
  }
  async function csrf(a: supertest.SuperAgentTest) { return (await a.get('/api/auth/csrf').expect(200)).body.token; }

  it('lists migrated automations read-only', async () => {
    const a = await loginAs(aOwnerEmail, 'a8-owner-password-123');
    const res = await a.get('/api/automations').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('rejects writes with 410 Gone — use /api/workflows', async () => {
    const a = await loginAs(aOwnerEmail, 'a8-owner-password-123');
    const t = await csrf(a);
    const create = await a.post('/api/automations').set('x-csrf-token', t).send({
      name: 'Legacy',
      definition: { trigger: { event: 'contact.created' }, steps: [] },
    });
    expect(create.status).toBe(410);
  });

  it('RBAC: a member cannot list automations', async () => {
    const owner = await loginAs(aOwnerEmail, 'a8-owner-password-123');
    const t1 = await csrf(owner);
    const memberEmail = `a8-member-${tenantAId.slice(0, 4)}@test.veyrasend`;
    await owner.post('/api/users').set('x-csrf-token', t1).send({
      email: memberEmail, password: 'a8-member-password-123', name: 'M', roleName: 'member',
    }).expect(201);
    const member = await loginAs(memberEmail, 'a8-member-password-123');
    expect((await member.get('/api/automations')).status).toBe(403);
  });
});
