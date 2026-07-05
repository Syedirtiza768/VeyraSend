import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { AuditLog, Tenant } from '@veyrasend/db';

describe('Phase 18 — Agency layer', () => {
  let app: INestApplication;
  let tenants: TenantsService;
  let ds: DataSource;
  let redisClient: { quit: () => Promise<void> };
  let agencyId: string;
  let sub1Id: string;
  let sub2Id: string;
  let ownerEmail: string;

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
    ownerEmail = `p18-${suffix}@test.veyrasend`;
    const agency = await tenants.createTenantWithOwner({
      name: `Agency ${suffix}`,
      slug: `agency-${suffix}`,
      ownerEmail,
      ownerPassword: 'password-123',
      ownerName: 'Agency Owner',
      type: 'agency',
    });
    agencyId = agency.tenant.id;

    const a = await loginAs(ownerEmail, 'password-123');
    let csrf = (await a.get('/api/auth/csrf')).body.token;
    const s1 = await a.post('/api/agency/sub-accounts').set('x-csrf-token', csrf).send({
      name: 'Client One',
      slug: `client1-${suffix}`,
      ownerEmail: `c1-${suffix}@test.veyrasend`,
      ownerPassword: 'password-123',
    }).expect(201);
    sub1Id = s1.body.id;

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const s2 = await a.post('/api/agency/sub-accounts').set('x-csrf-token', csrf).send({
      name: 'Client Two',
      slug: `client2-${suffix}`,
      ownerEmail: `c2-${suffix}@test.veyrasend`,
      ownerPassword: 'password-123',
    }).expect(201);
    sub2Id = s2.body.id;
  });

  afterAll(async () => {
    if (ds) {
      await ds.getRepository(Tenant).delete(sub2Id);
      await ds.getRepository(Tenant).delete(sub1Id);
      await ds.getRepository(Tenant).delete(agencyId);
    }
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

  it('sibling sub-accounts cannot see each others data', async () => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const sub1Users = await ds.query(
      `SELECT u.email FROM users u JOIN tenant_memberships m ON m.user_id = u.id WHERE m.tenant_id = $1 LIMIT 1`,
      [sub1Id],
    );
    const sub2Users = await ds.query(
      `SELECT u.email FROM users u JOIN tenant_memberships m ON m.user_id = u.id WHERE m.tenant_id = $1 LIMIT 1`,
      [sub2Id],
    );

    const a1 = await loginAs(sub1Users[0].email, 'password-123');
    let csrf = (await a1.get('/api/auth/csrf')).body.token;
    const c1 = await a1.post('/api/contacts').set('x-csrf-token', csrf).send({
      email: `isolated-${suffix}@sub1.test`,
      firstName: 'Sub1',
    }).expect(201);

    const a2 = await loginAs(sub2Users[0].email, 'password-123');
    csrf = (await a2.get('/api/auth/csrf')).body.token;
    await a2.get(`/api/contacts/${c1.body.id}`).set('x-csrf-token', csrf).expect(404);
  });

  it('act-as elevation is audited on start and end', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    let csrf = (await a.get('/api/auth/csrf')).body.token;
    await a.post(`/api/agency/sub-accounts/${sub1Id}/act-as`).set('x-csrf-token', csrf).expect(200);

    const startLogs = await ds.getRepository(AuditLog).find({
      where: { tenantId: sub1Id, action: 'agency.act_as.start' },
    });
    expect(startLogs.length).toBeGreaterThan(0);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    await a.post('/api/agency/act-as/return').set('x-csrf-token', csrf).expect(200);

    const endLogs = await ds.getRepository(AuditLog).find({
      where: { tenantId: sub1Id, action: 'agency.act_as.end' },
    });
    expect(endLogs.length).toBeGreaterThan(0);
  });

  it('rejects nesting sub-account under sub-account', async () => {
    await expect(
      tenants.createTenantWithOwner({
        name: 'Nested',
        slug: `nested-${Math.random().toString(36).slice(2, 8)}`,
        ownerEmail: `nested-${Math.random().toString(36).slice(2, 8)}@test.veyrasend`,
        ownerPassword: 'password-123',
        type: 'sub_account',
        parentTenantId: sub1Id,
      }),
    ).rejects.toMatchObject({ response: { message: 'nesting_not_allowed' } });
  });

  it('agency usage rollup includes sub-accounts', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    const rollup = await a.get('/api/usage/agency-rollup').expect(200);
    expect(rollup.body.agencyId).toBe(agencyId);
    expect(rollup.body.subAccounts.length).toBeGreaterThanOrEqual(2);
  });
});
