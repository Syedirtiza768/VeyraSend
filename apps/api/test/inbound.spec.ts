import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { Tenant, InboundThread, InboundMessage } from '@veyrasend/db';

describe('Phase 7 — inbound parse, threading, tenant isolation', () => {
  let app: INestApplication;
  let tenants: TenantsService;
  let ds: DataSource;
  let redisClient: { quit: () => Promise<void> };
  let tenantAId: string;
  let tenantBId: string;
  let aOwnerEmail: string;
  let bOwnerEmail: string;
  let aContactEmail: string;

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
    aOwnerEmail = `a7-owner-${suffix}@test.veyrasend`;
    bOwnerEmail = `b7-owner-${suffix}@test.veyrasend`;
    aContactEmail = `a7-contact-${suffix}@example.com`;
    const a = await tenants.createTenantWithOwner({ name: `A7 ${suffix}`, slug: `a7-${suffix}`, ownerEmail: aOwnerEmail, ownerPassword: 'a7-owner-password-123', ownerName: 'A7' });
    tenantAId = a.tenant.id;
    const b = await tenants.createTenantWithOwner({ name: `B7 ${suffix}`, slug: `b7-${suffix}`, ownerEmail: bOwnerEmail, ownerPassword: 'b7-owner-password-123', ownerName: 'B7' });
    tenantBId = b.tenant.id;

    const aOwner = await loginAs(aOwnerEmail, 'a7-owner-password-123');
    const t = await csrf(aOwner);
    await aOwner.post('/api/contacts').set('x-csrf-token', t).send({ email: aContactEmail }).expect(201);
  });

  afterAll(async () => {
    if (ds) await ds.getRepository(Tenant).delete([tenantAId, tenantBId]);
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

  it('ingests an inbound reply, groups replies into one thread, and attributes to the known contact tenant', async () => {
    const anon = agent();
    await anon.post('/api/webhooks/inbound').send({ from: aContactEmail, to: 'reply@tenant.test', subject: 'Re: Welcome', text: 'Thanks!' }).expect(200);
    const r2 = await anon.post('/api/webhooks/inbound').send({ from: aContactEmail, to: 'reply@tenant.test', subject: 'Re: Re: Welcome', text: 'Another reply' }).expect(200);
    expect(r2.body.attributed).toBe(true);
    expect(r2.body.threadId).toBeTruthy();

    const aOwner = await loginAs(aOwnerEmail, 'a7-owner-password-123');
    const threads = (await aOwner.get('/api/inbound/threads').expect(200)).body as Array<{ fromEmail: string; messageCount: number; subject: string }>;
    const mine = threads.find((t) => t.fromEmail === aContactEmail);
    expect(mine).toBeDefined();
    expect(mine!.messageCount).toBe(2); // both replies threaded

    const msgs = (await aOwner.get(`/api/inbound/threads/${r2.body.threadId}/messages`).expect(200)).body as Array<{ text: string | null }>;
    expect(msgs.length).toBe(2);
  });

  it('skips replies from unknown contacts (unattributed) and never creates cross-tenant rows', async () => {
    const anon = agent();
    const res = await anon.post('/api/webhooks/inbound').send({ from: 'stranger@example.com', to: 'reply@tenant.test', subject: 'hi', text: 'hi' }).expect(200);
    expect(res.body.attributed).toBe(false);

    const count = await ds.getRepository(InboundThread).count({ where: { tenantId: tenantAId } });
    // Still only the one thread from the previous test (aContactEmail).
    const strangers = await ds.getRepository(InboundMessage).find({ where: { tenantId: tenantAId, fromEmail: 'stranger@example.com' } });
    expect(strangers.length).toBe(0);
    expect(count).toBe(1);
  });

  it('tenant B cannot see tenant A inbound threads', async () => {
    const bOwner = await loginAs(bOwnerEmail, 'b7-owner-password-123');
    const threads = (await bOwner.get('/api/inbound/threads').expect(200)).body as Array<{ fromEmail: string }>;
    expect(threads.find((t) => t.fromEmail === aContactEmail)).toBeUndefined();
    // Direct cross-tenant read of A's thread → 200 but empty (service scopes by tenantId).
    const aThreadId = (await ds.getRepository(InboundThread).findOne({ where: { tenantId: tenantAId } }))!.id;
    const msgs = (await bOwner.get(`/api/inbound/threads/${aThreadId}/messages`).expect(200)).body as unknown[];
    expect(msgs.length).toBe(0);
  });
});
