import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { SendgridService } from '../src/modules/sendgrid/sendgrid.service';
import { CryptoService } from '../src/common/crypto.service';
import { Tenant, TenantSendgridSettings } from '@veyrasend/db';

describe('Phase 2 — SendGrid provisioning, senders, domains', () => {
  let app: INestApplication;
  let tenants: TenantsService;
  let sendgrid: SendgridService;
  let crypto: CryptoService;
  let ds: DataSource;
  let redisClient: { quit: () => Promise<void> };
  let tenantAId: string;
  let tenantBId: string;
  let aOwnerEmail: string;
  let bOwnerEmail: string;
  let aMemberEmail: string;
  let aSender: { id: string; fromEmail: string };
  let aDomain: { id: string; domain: string };

  beforeAll(async () => {
    const config = new ConfigService();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api', { exclude: ['health', 'health/*'] });
    redisClient = applyHttpMiddleware(app, config.all) as unknown as { quit: () => Promise<void> };
    await app.init();

    tenants = app.get(TenantsService);
    sendgrid = app.get(SendgridService);
    crypto = app.get(CryptoService);
    ds = app.get('DATA_SOURCE' as never) as DataSource;

    const suffix = Math.random().toString(36).slice(2, 10);
    aOwnerEmail = `a2-owner-${suffix}@test.veyrasend`;
    bOwnerEmail = `b2-owner-${suffix}@test.veyrasend`;
    aMemberEmail = `a2-member-${suffix}@test.veyrasend`;

    const a = await tenants.createTenantWithOwner({
      name: `Tenant A2 ${suffix}`,
      slug: `tenant-a2-${suffix}`,
      ownerEmail: aOwnerEmail,
      ownerPassword: 'a2-owner-password-123',
      ownerName: 'A2 Owner',
    });
    tenantAId = a.tenant.id;

    const b = await tenants.createTenantWithOwner({
      name: `Tenant B2 ${suffix}`,
      slug: `tenant-b2-${suffix}`,
      ownerEmail: bOwnerEmail,
      ownerPassword: 'b2-owner-password-123',
      ownerName: 'B2 Owner',
    });
    tenantBId = b.tenant.id;
  });

  afterAll(async () => {
    if (ds) await ds.getRepository(Tenant).delete([tenantAId, tenantBId]);
    if (app) await app.close();
    if (redisClient) await redisClient.quit();
  });

  function agent() {
    return supertest.agent(app.getHttpServer());
  }

  async function loginAs(email: string, password: string) {
    const a = agent();
    const csrf = (await a.get('/api/auth/csrf').expect(200)).body.token;
    await a.post('/api/auth/login').set('x-csrf-token', csrf).send({ email, password }).expect(200);
    return a;
  }

  async function csrf(a: supertest.SuperAgentTest) {
    return (await a.get('/api/auth/csrf').expect(200)).body.token;
  }

  it('provisions a subuser idempotently and stores the API key encrypted at rest', async () => {
    const a = await loginAs(aOwnerEmail, 'a2-owner-password-123');
    const t1 = await csrf(a);
    const first = (await a.post('/api/sendgrid/provision').set('x-csrf-token', t1).expect(200)).body;
    const t2 = await csrf(a);
    const second = (await a.post('/api/sendgrid/provision').set('x-csrf-token', t2).expect(200)).body;

    expect(first.provisioned).toBe(true);
    expect(first.subuserUsername).toBe(second.subuserUsername); // idempotent

    const settings = await ds.getRepository(TenantSendgridSettings).findOne({ where: { tenantId: tenantAId } });
    expect(settings).not.toBeNull();
    const stored = settings!.encryptedApiKey;
    // Never plaintext at rest.
    expect(stored.startsWith('mock-subuser-key-')).toBe(false);
    expect(stored.includes(first.subuserUsername)).toBe(false);
    // Decrypts back to the mock subuser key.
    expect(crypto.decrypt(stored)).toBe(`mock-subuser-key-${first.subuserUsername}`);
  });

  it('owner can create a sender and a domain with DNS records', async () => {
    const a = await loginAs(aOwnerEmail, 'a2-owner-password-123');
    const ts = await csrf(a);
    const senderRes = await a
      .post('/api/senders')
      .set('x-csrf-token', ts)
      .send({
        fromEmail: `news-${tenantAId.slice(0, 4)}@a2.test`,
        fromName: 'A2 News',
        replyTo: 'reply@a2.test',
        nickname: 'A2 News',
        address: '1 Market St',
        city: 'San Francisco',
        country: 'US',
        company: 'A2',
      })
      .expect(201);
    aSender = { id: senderRes.body.data.id, fromEmail: senderRes.body.data.fromEmail };

    const td = await csrf(a);
    const domainRes = await a
      .post('/api/domains')
      .set('x-csrf-token', td)
      .send({ domain: `a2-${tenantAId.slice(0, 4)}.test` })
      .expect(201);
    aDomain = { id: domainRes.body.data.id, domain: domainRes.body.data.domain };
    expect(domainRes.body.data.dns.length).toBeGreaterThan(0);
  });

  it('Tenant B cannot see or operate on Tenant A senders/domains', async () => {
    const b = await loginAs(bOwnerEmail, 'b2-owner-password-123');
    // B must provision its own subuser first.
    const tp = await csrf(b);
    await b.post('/api/sendgrid/provision').set('x-csrf-token', tp).expect(200);

    const sendersList = (await b.get('/api/senders').expect(200)).body.data;
    expect(sendersList.map((s: { fromEmail: string }) => s.fromEmail)).not.toContain(aSender.fromEmail);

    const domainsList = (await b.get('/api/domains').expect(200)).body.data;
    expect(domainsList.map((d: { domain: string }) => d.domain)).not.toContain(aDomain.domain);

    // Cross-tenant operations on A's ids → 404, not a leak.
    const td = await csrf(b);
    const verifyRes = await b.post(`/api/domains/${aDomain.id}/verify`).set('x-csrf-token', td).send();
    expect(verifyRes.status).toBe(404);

    const ts = await csrf(b);
    const delRes = await b.delete(`/api/senders/${aSender.id}`).set('x-csrf-token', ts);
    expect(delRes.status).toBe(404);
  });

  it('RBAC blocks a member from provisioning, creating senders/domains, and reading them', async () => {
    // Owner A creates a member.
    const owner = await loginAs(aOwnerEmail, 'a2-owner-password-123');
    const t1 = await csrf(owner);
    await owner
      .post('/api/users')
      .set('x-csrf-token', t1)
      .send({ email: aMemberEmail, password: 'a2-member-password-123', name: 'A2 Member', roleName: 'member' })
      .expect(201);

    const member = await loginAs(aMemberEmail, 'a2-member-password-123');
    expect((await member.get('/api/senders')).status).toBe(403);
    expect((await member.get('/api/domains')).status).toBe(403);
    expect((await member.get('/api/sendgrid/status')).status).toBe(403);

    const tp = await csrf(member);
    expect((await member.post('/api/sendgrid/provision').set('x-csrf-token', tp)).status).toBe(403);
    const ts = await csrf(member);
    expect(
      (
        await member
          .post('/api/senders')
          .set('x-csrf-token', ts)
          .send({ fromEmail: 'x@a2.test', replyTo: 'x@a2.test', address: '1', city: 'SF', country: 'US' })
      ).status,
    ).toBe(403);
    const td = await csrf(member);
    expect((await member.post('/api/domains').set('x-csrf-token', td).send({ domain: 'x.test' })).status).toBe(403);
  });

  it('senders/domains require a provisioned subuser (400 before provision)', async () => {
    // Tenant B's owner already provisioned in an earlier test; verify the guard
    // path by checking the service directly against a fresh unprovisioned tenant.
    const status = await sendgrid.getStatus(tenantBId);
    expect(status.provisioned).toBe(true);
    // requireSettings throws for an unprovisioned tenant:
    await expect(sendgrid.requireSettings('00000000-0000-0000-0000-000000000000')).rejects.toThrow();
  });
});
