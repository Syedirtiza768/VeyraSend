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
import { Tenant, Contact, Suppression } from '@veyrasend/db';

describe('Phase 4 — contacts, lists, segments, suppressions', () => {
  let app: INestApplication;
  let tenants: TenantsService;
  let sendgrid: SendgridService;
  let ds: DataSource;
  let redisClient: { quit: () => Promise<void> };
  let tenantAId: string;
  let tenantBId: string;
  let aOwnerEmail: string;
  let bOwnerEmail: string;
  let aMemberEmail: string;

  beforeAll(async () => {
    const config = new ConfigService();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api', { exclude: ['health', 'health/*'] });
    redisClient = applyHttpMiddleware(app, config.all) as unknown as { quit: () => Promise<void> };
    await app.init();

    tenants = app.get(TenantsService);
    sendgrid = app.get(SendgridService);
    ds = app.get('DATA_SOURCE' as never) as DataSource;

    const suffix = Math.random().toString(36).slice(2, 10);
    aOwnerEmail = `a4-owner-${suffix}@test.veyrasend`;
    bOwnerEmail = `b4-owner-${suffix}@test.veyrasend`;
    aMemberEmail = `a4-member-${suffix}@test.veyrasend`;

    const a = await tenants.createTenantWithOwner({
      name: `Tenant A4 ${suffix}`,
      slug: `tenant-a4-${suffix}`,
      ownerEmail: aOwnerEmail,
      ownerPassword: 'a4-owner-password-123',
      ownerName: 'A4 Owner',
    });
    tenantAId = a.tenant.id;
    const b = await tenants.createTenantWithOwner({
      name: `Tenant B4 ${suffix}`,
      slug: `tenant-b4-${suffix}`,
      ownerEmail: bOwnerEmail,
      ownerPassword: 'b4-owner-password-123',
      ownerName: 'B4 Owner',
    });
    tenantBId = b.tenant.id;
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
  async function csrf(a: supertest.SuperAgentTest) {
    return (await a.get('/api/auth/csrf').expect(200)).body.token;
  }

  it('imports contacts via CSV and upserts duplicates', async () => {
    const a = await loginAs(aOwnerEmail, 'a4-owner-password-123');
    const t = await csrf(a);
    const csv = 'email,first_name,last_name,plan\njane@example.com,Jane,Doe,pro\nbob@example.com,Bob,Smith,free\njane@example.com,Jane2,Doe2,pro';
    const res = await a.post('/api/contacts/import').set('x-csrf-token', t).send({ csv }).expect(200);
    expect(res.body.imported).toBe(3);
    expect(res.body.skipped).toBe(0);

    const list = (await a.get('/api/contacts').expect(200)).body as Array<{ email: string; firstName: string | null }>;
    const jane = list.find((c) => c.email === 'jane@example.com');
    expect(jane).toBeDefined();
    // Upsert preserves existing status and updates name fields.
    expect(jane!.firstName).toBe('Jane2');
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it('creates a list, adds members, and evaluates a list-based segment', async () => {
    const a = await loginAs(aOwnerEmail, 'a4-owner-password-123');
    const t1 = await csrf(a);
    const listRes = await a.post('/api/lists').set('x-csrf-token', t1).send({ name: 'Pro plan' }).expect(201);
    const listId = listRes.body.id as string;

    const contacts = (await a.get('/api/contacts').expect(200)).body as Array<{ id: string; email: string }>;
    const jane = contacts.find((c) => c.email === 'jane@example.com')!;
    const bob = contacts.find((c) => c.email === 'bob@example.com')!;
    const t2 = await csrf(a);
    await a.post(`/api/lists/${listId}/members`).set('x-csrf-token', t2).send({ contactId: jane.id }).expect(204);

    const t3 = await csrf(a);
    const segRes = await a
      .post('/api/segments')
      .set('x-csrf-token', t3)
      .send({ name: 'Pro list members', definition: { combinator: 'and', rules: [{ field: 'list', op: 'eq', value: listId }] } })
      .expect(201);
    const segId = segRes.body.id as string;

    const evalRes = await a.get(`/api/segments/${segId}/evaluate`).expect(200);
    expect(evalRes.body.count).toBe(1);
    expect((evalRes.body.sample as Array<{ email: string }>)[0].email).toBe('jane@example.com');

    const members = (await a.get(`/api/lists/${listId}/members`).expect(200)).body as Array<{ email: string }>;
    expect(members.map((m) => m.email)).toContain('jane@example.com');
    expect(members.map((m) => m.email)).not.toContain('bob@example.com');
  });

  it('tenant B cannot see tenant A contacts, lists, segments, or suppressions', async () => {
    const b = await loginAs(bOwnerEmail, 'b4-owner-password-123');
    const contacts = (await b.get('/api/contacts').expect(200)).body as Array<{ email: string }>;
    expect(contacts.find((c) => c.email === 'jane@example.com')).toBeUndefined();
    const lists = (await b.get('/api/lists').expect(200)).body as Array<{ name: string }>;
    expect(lists.find((l) => l.name === 'Pro plan')).toBeUndefined();
    const segs = (await b.get('/api/segments').expect(200)).body as Array<{ name: string }>;
    expect(segs.find((s) => s.name === 'Pro list members')).toBeUndefined();
  });

  it('auto-records a suppression and updates contact status from an unsubscribe event webhook', async () => {
    const a = await loginAs(aOwnerEmail, 'a4-owner-password-123');
    // Provision + send a message so we have an sg_message_id to attribute the event.
    const tp = await csrf(a);
    await a.post('/api/sendgrid/provision').set('x-csrf-token', tp).expect(200);
    const ts = await csrf(a);
    const sendRes = await a
      .post('/api/messages/send')
      .set('x-csrf-token', ts)
      .send({ fromEmail: 'news@a4.test', toEmail: 'jane@example.com', subject: 'hi', html: '<p>hi</p>' })
      .expect(201);
    const msgId = sendRes.body.id as string;

    // Wait for the worker to set sg_message_id.
    let sgMessageId: string | null = null;
    for (let i = 0; i < 40 && !sgMessageId; i++) {
      const list = (await a.get('/api/messages').expect(200)).body as Array<{ id: string; sgMessageId: string | null }>;
      sgMessageId = list.find((m) => m.id === msgId)?.sgMessageId ?? null;
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(sgMessageId).toBeTruthy();

    const anon = agent();
    await anon
      .post('/api/webhooks/events')
      .send([{ sg_event_id: `unsub-${msgId}`, sg_message_id: sgMessageId, event: 'unsubscribe', email: 'jane@example.com', timestamp: Math.floor(Date.now() / 1000) }])
      .expect(200);

    const sups = (await a.get('/api/suppressions').expect(200)).body as Array<{ email: string; reason: string }>;
    expect(sups.find((s) => s.email === 'jane@example.com' && s.reason === 'unsubscribe')).toBeDefined();

    const jane = await ds.getRepository(Contact).findOne({ where: { tenantId: tenantAId, email: 'jane@example.com' } });
    expect(jane?.status).toBe('unsubscribed');
  });

  it('RBAC: a member can read contacts/lists/segments but cannot write/delete', async () => {
    const owner = await loginAs(aOwnerEmail, 'a4-owner-password-123');
    const t1 = await csrf(owner);
    await owner.post('/api/users').set('x-csrf-token', t1).send({ email: aMemberEmail, password: 'a4-member-password-123', name: 'A4 Member', roleName: 'member' }).expect(201);

    const member = await loginAs(aMemberEmail, 'a4-member-password-123');
    expect((await member.get('/api/contacts')).status).toBe(200);
    expect((await member.get('/api/lists')).status).toBe(200);
    const ts = await csrf(member);
    expect((await member.post('/api/contacts').set('x-csrf-token', ts).send({ email: 'x@y.com' })).status).toBe(403);
    expect((await member.post('/api/lists').set('x-csrf-token', ts).send({ name: 'no' })).status).toBe(403);
  });

  it('suppressions are deduped and tenant-isolated', async () => {
    const a = await loginAs(aOwnerEmail, 'a4-owner-password-123');
    const t = await csrf(a);
    await a.post('/api/suppressions').set('x-csrf-token', t).send({ email: 'dedupe@example.com', reason: 'manual' }).expect(201);
    await a.post('/api/suppressions').set('x-csrf-token', t).send({ email: 'dedupe@example.com', reason: 'manual' }).expect(201);
    const rows = await ds.getRepository(Suppression).find({ where: { tenantId: tenantAId, email: 'dedupe@example.com', reason: 'manual' } });
    expect(rows.length).toBe(1);

    const b = await loginAs(bOwnerEmail, 'b4-owner-password-123');
    const bSups = (await b.get('/api/suppressions').expect(200)).body as Array<{ email: string }>;
    expect(bSups.find((s) => s.email === 'dedupe@example.com')).toBeUndefined();
  });
});
