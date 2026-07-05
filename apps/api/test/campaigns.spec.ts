import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { SuppressionsService } from '../src/modules/suppressions/suppressions.service';
import { Tenant, Message } from '@veyrasend/db';

describe('Phase 6 — campaigns fan out to a segment and respect suppressions', () => {
  let app: INestApplication;
  let tenants: TenantsService;
  let suppressions: SuppressionsService;
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
    suppressions = app.get(SuppressionsService);
    ds = app.get('DATA_SOURCE' as never) as DataSource;

    const suffix = Math.random().toString(36).slice(2, 10);
    aOwnerEmail = `a6-owner-${suffix}@test.veyrasend`;
    const a = await tenants.createTenantWithOwner({ name: `A6 ${suffix}`, slug: `a6-${suffix}`, ownerEmail: aOwnerEmail, ownerPassword: 'a6-owner-password-123', ownerName: 'A6' });
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

  async function setupFixture(a: supertest.SuperAgentTest) {
    const tp = await csrf(a);
    await a.post('/api/sendgrid/provision').set('x-csrf-token', tp).expect(200);

    // Contacts: 3 active + 1 unsubscribed.
    const tc = await csrf(a);
    const csv = 'email,first_name,plan\nalice@example.com,Alice,pro\nbob@example.com,Bob,free\ncarol@example.com,Carol,pro\ndan@example.com,Dan,free';
    await a.post('/api/contacts/import').set('x-csrf-token', tc).send({ csv }).expect(200);
    // Mark dan unsubscribed via a suppression + status (simulating a prior unsubscribe).
    await suppressions.add(tenantAId, 'dan@example.com', 'unsubscribe', 'test');
    // also suppress carol manually (active contact but suppressed → excluded)
    await suppressions.add(tenantAId, 'carol@example.com', 'manual', 'test');

    // Template.
    const tt = await csrf(a);
    const tmpl = await a.post('/api/templates').set('x-csrf-token', tt).send({
      name: 'Promo', subject: 'Hi {{first_name}}', html: '<p>{{first_name}} - {{plan}}</p>',
      variables: [{ key: 'first_name' }, { key: 'plan' }],
    }).expect(201);
    const templateId = tmpl.body.id as string;

    // Segment: plan eq pro (matches alice, carol, dan? dan plan=free). So alice + carol.
    const ts = await csrf(a);
    const seg = await a.post('/api/segments').set('x-csrf-token', ts).send({
      name: 'Pro plan', definition: { combinator: 'and', rules: [{ field: 'custom:plan', op: 'eq', value: 'pro' }] },
    }).expect(201);
    const segmentId = seg.body.id as string;
    return { templateId, segmentId };
  }

  it('sends only to eligible (active, non-suppressed) recipients in the segment', async () => {
    const a = await loginAs(aOwnerEmail, 'a6-owner-password-123');
    const { templateId, segmentId } = await setupFixture(a);

    const tcc = await csrf(a);
    const camp = await a.post('/api/campaigns').set('x-csrf-token', tcc).send({
      name: 'Promo blast', templateId, segmentId, fromEmail: 'news@promo.test',
    }).expect(201);
    const campaignId = camp.body.id as string;

    const ts2 = await csrf(a);
    const sent = await a.post(`/api/campaigns/${campaignId}/send`).set('x-csrf-token', ts2).expect(200);
    // Segment matches alice + carol; carol suppressed → only alice.
    expect(sent.body.status).toBe('sent');
    expect(sent.body.recipients).toBe(1);

    const messages = await ds.getRepository(Message).find({ where: { tenantId: tenantAId, campaignId } });
    expect(messages.length).toBe(1);
    expect(messages[0].toEmail).toBe('alice@example.com');
    expect(messages[0].kind).toBe('campaign');

    // Stats show 1 recipient.
    const stats = (await a.get(`/api/campaigns/${campaignId}/stats`).expect(200)).body;
    expect(stats.recipients).toBe(1);
  });

  it('a second send of the same campaign is rejected', async () => {
    const a = await loginAs(aOwnerEmail, 'a6-owner-password-123');
    const list = (await a.get('/api/campaigns').expect(200)).body as Array<{ status: string }>;
    const sent = list.find((c) => c.status === 'sent')!;
    const t = await csrf(a);
    const res = await a.post(`/api/campaigns/${sent.id}/send`).set('x-csrf-token', t);
    expect(res.status).toBe(400);
  });

  it('RBAC: a member can read campaigns but cannot send', async () => {
    const owner = await loginAs(aOwnerEmail, 'a6-owner-password-123');
    const t1 = await csrf(owner);
    const memberEmail = `a6-member-${tenantAId.slice(0, 4)}@test.veyrasend`;
    await owner.post('/api/users').set('x-csrf-token', t1).send({ email: memberEmail, password: 'a6-member-password-123', name: 'M', roleName: 'member' }).expect(201);
    const member = await loginAs(memberEmail, 'a6-member-password-123');
    expect((await member.get('/api/campaigns')).status).toBe(200);
    const list = (await member.get('/api/campaigns').expect(200)).body as Array<{ id: string }>;
    const ts = await csrf(member);
    expect((await member.post(`/api/campaigns/${list[0].id}/send`).set('x-csrf-token', ts)).status).toBe(403);
  });
});
