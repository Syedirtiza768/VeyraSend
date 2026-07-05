import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { SettingsService } from '../src/modules/settings/settings.service';
import { RetentionService } from '../src/modules/retention/retention.service';
import { Tenant, EmailEvent, Message } from '@veyrasend/db';

describe('Phase 10 — admin: settings, audit, usage, retention', () => {
  let app: INestApplication;
  let tenants: TenantsService;
  let settings: SettingsService;
  let retention: RetentionService;
  let ds: DataSource;
  let redisClient: { quit: () => Promise<void> };
  let tenantId: string;
  let ownerEmail: string;

  beforeAll(async () => {
    const config = new ConfigService();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api', { exclude: ['health', 'health/*'] });
    redisClient = applyHttpMiddleware(app, config.all) as unknown as { quit: () => Promise<void> };
    await app.init();
    tenants = app.get(TenantsService);
    settings = app.get(SettingsService);
    retention = app.get(RetentionService);
    ds = app.get('DATA_SOURCE' as never) as DataSource;

    const suffix = Math.random().toString(36).slice(2, 10);
    ownerEmail = `a10-owner-${suffix}@test.veyrasend`;
    const a = await tenants.createTenantWithOwner({ name: `A10 ${suffix}`, slug: `a10-${suffix}`, ownerEmail, ownerPassword: 'a10-owner-password-123', ownerName: 'A10' });
    tenantId = a.tenant.id;
  });

  afterAll(async () => {
    if (ds) await ds.getRepository(Tenant).delete([tenantId]);
    if (app) await app.close();
    if (redisClient) await redisClient.quit();
  });

  function agent() { return supertest.agent(app.getHttpServer()); }
  async function login() {
    const a = agent();
    const csrf = (await a.get('/api/auth/csrf').expect(200)).body.token;
    await a.post('/api/auth/login').set('x-csrf-token', csrf).send({ email: ownerEmail, password: 'a10-owner-password-123' }).expect(200);
    return a;
  }
  async function csrf(a: supertest.SuperAgentTest) { return (await a.get('/api/auth/csrf').expect(200)).body.token; }

  it('settings: defaults are created on first read and persisted on update', async () => {
    const a = await login();
    const first = (await a.get('/api/settings').expect(200)).body;
    expect(first.eventRetentionDays).toBe(90);
    expect(first.messageRetentionDays).toBe(365);

    const t = await csrf(a);
    const updated = (await a.put('/api/settings').set('x-csrf-token', t).send({ eventRetentionDays: 7, messageRetentionDays: 30, inboundRetentionDays: 14 }).expect(200)).body;
    expect(updated.eventRetentionDays).toBe(7);
    expect(updated.messageRetentionDays).toBe(30);
    expect(updated.inboundRetentionDays).toBe(14);

    const again = await settings.get(tenantId);
    expect(again.eventRetentionDays).toBe(7);
  });

  it('audit: state-changing actions are recorded and readable', async () => {
    const a = await login();
    // The settings update above already wrote an audit entry.
    const t = await csrf(a);
    await a.put('/api/settings').set('x-csrf-token', t).send({ eventRetentionDays: 5 }).expect(200);
    const res = (await a.get('/api/audit?limit=10').expect(200)).body;
    expect(res.total).toBeGreaterThanOrEqual(1);
    expect(res.items.some((i: { action: string }) => i.action === 'settings.update')).toBe(true);
  });

  it('usage: returns inventory counts and current-month volumes', async () => {
    const a = await login();
    const u = (await a.get('/api/usage').expect(200)).body;
    expect(u.counts).toBeDefined();
    expect(u.thisMonth).toBeDefined();
    expect(typeof u.thisMonth.messages).toBe('number');
    expect(u.subuser).toBeDefined();
  });

  it('retention: hard-deletes rows older than the configured window', async () => {
    // Set a 1-day retention and insert an event + message backdated 10 days.
    await settings.update(tenantId, { eventRetentionDays: 1, messageRetentionDays: 1, inboundRetentionDays: 1 });
    const oldDate = new Date(Date.now() - 10 * 86400_000);

    const evt = ds.getRepository(EmailEvent).create({
      tenantId, eventType: 'open', sgMessageId: 'old-msg', sgEventId: `old-evt-${Math.random()}`,
      recipient: 'old@example.com', sgTimestamp: Math.floor(oldDate.getTime() / 1000), raw: {},
    });
    // override created_at via raw SQL after insert
    await ds.getRepository(EmailEvent).save(evt);
    await ds.query(`UPDATE email_events SET created_at = $1 WHERE sg_event_id = $2`, [oldDate, evt.sgEventId]);

    const msg = ds.getRepository(Message).create({
      tenantId, kind: 'transactional', campaignId: null, fromEmail: 'x@x.test', toEmail: 'old@example.com',
      subject: 's', status: 'sent', sgMessageId: `old-msg-${Math.random()}`, idempotencyKey: `old-${Math.random()}`, reason: null,
    });
    await ds.getRepository(Message).save(msg);
    await ds.query(`UPDATE messages SET created_at = $1 WHERE id = $2`, [oldDate, msg.id]);

    const result = await retention.tick();
    expect(result.events).toBeGreaterThanOrEqual(1);
    expect(result.messages).toBeGreaterThanOrEqual(1);

    const evtGone = await ds.getRepository(EmailEvent).findOne({ where: { sgEventId: evt.sgEventId } });
    const msgGone = await ds.getRepository(Message).findOne({ where: { id: msg.id } });
    expect(evtGone).toBeNull();
    expect(msgGone).toBeNull();
  });

  it('RBAC: a member cannot read audit, settings, or usage', async () => {
    const owner = await login();
    const t1 = await csrf(owner);
    const memberEmail = `a10-member-${tenantId.slice(0, 4)}@test.veyrasend`;
    await owner.post('/api/users').set('x-csrf-token', t1).send({ email: memberEmail, password: 'a10-member-password-123', name: 'M', roleName: 'member' }).expect(201);
    const m = agent();
    const mc = (await m.get('/api/auth/csrf').expect(200)).body.token;
    await m.post('/api/auth/login').set('x-csrf-token', mc).send({ email: memberEmail, password: 'a10-member-password-123' }).expect(200);

    expect((await m.get('/api/audit')).status).toBe(403);
    expect((await m.get('/api/settings')).status).toBe(403);
    expect((await m.get('/api/usage')).status).toBe(403);
  });
});
