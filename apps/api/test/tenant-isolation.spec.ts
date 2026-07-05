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

describe('Phase 1 — tenancy isolation & RBAC', () => {
  let app: INestApplication;
  let tenants: TenantsService;
  let ds: DataSource;
  let redisClient: { quit: () => Promise<void> };
  let tenantAId: string;
  let tenantBId: string;
  let aOwnerEmail: string;
  let bOwnerEmail: string;
  let bOwnerUserId: string;
  let aMemberEmail: string;

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
    aOwnerEmail = `a-owner-${suffix}@test.veyrasend`;
    bOwnerEmail = `b-owner-${suffix}@test.veyrasend`;
    aMemberEmail = `a-member-${suffix}@test.veyrasend`;

    const a = await tenants.createTenantWithOwner({
      name: `Tenant A ${suffix}`,
      slug: `tenant-a-${suffix}`,
      ownerEmail: aOwnerEmail,
      ownerPassword: 'a-owner-password-123',
      ownerName: 'A Owner',
    });
    tenantAId = a.tenant.id;

    const b = await tenants.createTenantWithOwner({
      name: `Tenant B ${suffix}`,
      slug: `tenant-b-${suffix}`,
      ownerEmail: bOwnerEmail,
      ownerPassword: 'b-owner-password-123',
      ownerName: 'B Owner',
    });
    tenantBId = b.tenant.id;
    bOwnerUserId = b.owner.id;
  });

  afterAll(async () => {
    // Cascade deletes memberships, roles, and audit logs for these tenants.
    if (ds) {
      await ds.getRepository(Tenant).delete([tenantAId, tenantBId]);
    }
    if (app) await app.close();
    if (redisClient) await redisClient.quit();
  });

  function agent() {
    return supertest.agent(app.getHttpServer());
  }

  async function loginAs(email: string, password: string) {
    const a = agent();
    const csrf = (await a.get('/api/auth/csrf').expect(200)).body.token;
    await a
      .post('/api/auth/login')
      .set('x-csrf-token', csrf)
      .send({ email, password })
      .expect(200);
    return a;
  }

  async function csrfToken(a: supertest.SuperAgentTest) {
    return (await a.get('/api/auth/csrf').expect(200)).body.token;
  }

  it('a user in Tenant A sees only Tenant A users', async () => {
    const a = await loginAs(aOwnerEmail, 'a-owner-password-123');
    const res = await a.get('/api/users').expect(200);
    const emails = (res.body.data as { email: string }[]).map((u) => u.email);
    expect(emails).toContain(aOwnerEmail);
    expect(emails).not.toContain(bOwnerEmail);
  });

  it('a user in Tenant A cannot operate on a Tenant B user id (404, not a leak)', async () => {
    const a = await loginAs(aOwnerEmail, 'a-owner-password-123');
    const token = await csrfToken(a);
    const res = await a
      .patch(`/api/users/${bOwnerUserId}`)
      .set('x-csrf-token', token)
      .send({ roleName: 'admin' });
    expect(res.status).toBe(404);
  });

  it('RBAC blocks a member from creating users (403)', async () => {
    // Owner A creates a member in Tenant A.
    const ownerA = await loginAs(aOwnerEmail, 'a-owner-password-123');
    const t1 = await csrfToken(ownerA);
    await ownerA
      .post('/api/users')
      .set('x-csrf-token', t1)
      .send({ email: aMemberEmail, password: 'a-member-password-123', name: 'A Member', roleName: 'member' })
      .expect(201);

    // Member logs in and is blocked from user management.
    const member = await loginAs(aMemberEmail, 'a-member-password-123');
    expect((await member.get('/api/users')).status).toBe(403);
    const t2 = await csrfToken(member);
    const res = await member
      .post('/api/users')
      .set('x-csrf-token', t2)
      .send({ email: `intruder-${Date.now()}@test.veyrasend`, password: 'intruder-password-123', roleName: 'member' });
    expect(res.status).toBe(403);
  });

  it('mutations without a CSRF token are rejected (403)', async () => {
    const a = await loginAs(aOwnerEmail, 'a-owner-password-123');
    const res = await a
      .post('/api/users')
      .send({ email: `no-csrf-${Date.now()}@test.veyrasend`, password: 'pw-password-12345', roleName: 'member' });
    expect(res.status).toBe(403);
  });
});
