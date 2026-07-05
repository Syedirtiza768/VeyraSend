import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { WebhooksService } from '../src/modules/webhooks/webhooks.service';
import { Tenant, Message, EmailEvent } from '@veyrasend/db';

describe('Phase 9 — analytics reconciles ledger vs raw events', () => {
  let app: INestApplication;
  let tenants: TenantsService;
  let analytics: AnalyticsService;
  let webhooks: WebhooksService;
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
    analytics = app.get(AnalyticsService);
    webhooks = app.get(WebhooksService);
    ds = app.get('DATA_SOURCE' as never) as DataSource;

    const suffix = Math.random().toString(36).slice(2, 10);
    ownerEmail = `a9-owner-${suffix}@test.veyrasend`;
    const a = await tenants.createTenantWithOwner({ name: `A9 ${suffix}`, slug: `a9-${suffix}`, ownerEmail, ownerPassword: 'a9-owner-password-123', ownerName: 'A9' });
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
    await a.post('/api/auth/login').set('x-csrf-token', csrf).send({ email: ownerEmail, password: 'a9-owner-password-123' }).expect(200);
    return a;
  }
  async function csrf(a: supertest.SuperAgentTest) { return (await a.get('/api/auth/csrf').expect(200)).body.token; }

  async function seedMessage(status: Message['status'], to: string): Promise<string> {
    const sgMessageId = `msg-${to}-${Math.random().toString(36).slice(2, 8)}`;
    const repo = ds.getRepository(Message);
    const row = repo.create({ tenantId, kind: 'transactional', campaignId: null, fromEmail: 'x@x.test', toEmail: to, subject: 's', status, sgMessageId, idempotencyKey: `${to}-${Math.random()}`, reason: null });
    await repo.save(row);
    return sgMessageId;
  }
  async function ingestEvent(type: string, sgMessageId: string, recipient: string, sgEventId?: string): Promise<void> {
    await webhooks.ingest({
      rawBody: '[]',
      signature: '',
      timestamp: '',
      events: [{ sg_event_id: sgEventId ?? `ev-${type}-${sgMessageId}-${Math.random()}`, sg_message_id: sgMessageId, event: type, email: recipient, timestamp: Math.floor(Date.now() / 1000), raw: {} }],
    });
  }

  it('aggregates ledger counts and event counts, and computes derived rates', async () => {
    const id1 = await seedMessage('sent', 'alice@example.com');
    const id2 = await seedMessage('sent', 'bob@example.com');
    await seedMessage('queued', 'queued@example.com');
    await seedMessage('failed', 'failed@example.com');

    await ingestEvent('processed', id1, 'alice@example.com');
    await ingestEvent('delivered', id1, 'alice@example.com');
    await ingestEvent('open', id1, 'alice@example.com');
    await ingestEvent('click', id1, 'alice@example.com');
    await ingestEvent('processed', id2, 'bob@example.com');
    await ingestEvent('bounce', id2, 'bob@example.com');

    const ov = await analytics.overview(tenantId, 30);
    // Ledger reflects post-event status: alice→delivered, bob→bounced, queued/failed unchanged.
    expect(ov.messages.delivered).toBe(1);
    expect(ov.messages.bounced).toBe(1);
    expect(ov.messages.queued).toBe(1);
    expect(ov.messages.failed).toBe(1);
    expect(ov.events.processed).toBe(2);
    expect(ov.events.delivered).toBe(1);
    expect(ov.events.bounce).toBe(1);
    expect(ov.events.open).toBe(1);
    expect(ov.events.click).toBe(1);
    // delivery = delivered / (processed + delivered) = 1 / (2 + 1) = 0.3333
    expect(ov.rates.delivery).toBeCloseTo(1 / 3, 3);
    // open rate = opens / delivered = 1
    expect(ov.rates.open).toBe(1);
  });

  it('timeseries returns one bucket per day for the window', async () => {
    const ts = await analytics.timeseries(tenantId, 7);
    expect(ts.length).toBe(7);
    expect(ts.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.day))).toBe(true);
    const totalSent = ts.reduce((acc, p) => acc + p.sent, 0);
    expect(totalSent).toBeGreaterThanOrEqual(4); // alice, bob, queued, failed seeded above
  });

  it('exposes overview and timeseries over HTTP with owner session', async () => {
    const a = await login();
    const ov = (await a.get('/api/analytics/overview').expect(200)).body;
    expect(ov.messages).toBeDefined();
    expect(ov.rates).toBeDefined();
    const ts = (await a.get('/api/analytics/timeseries?days=3').expect(200)).body;
    expect(ts.length).toBe(3);
  });

  it('dedup: ingesting the same sg_event_id twice does not double-count', async () => {
    const before = (await analytics.overview(tenantId, 30)).events.open;
    const id = await seedMessage('sent', 'dedup@example.com');
    await ingestEvent('open', id, 'dedup@example.com', 'dup-ev-1');
    await webhooks.ingest({ rawBody: '[]', signature: '', timestamp: '', events: [{ sg_event_id: 'dup-ev-1', sg_message_id: id, event: 'open', email: 'dedup@example.com', timestamp: Math.floor(Date.now() / 1000), raw: {} }] });
    const after = (await analytics.overview(tenantId, 30)).events.open;
    expect(after).toBe(before + 1);
    // raw events table should reflect the single row
    const rows = await ds.getRepository(EmailEvent).find({ where: { tenantId, sgMessageId: id, eventType: 'open' } });
    expect(rows.length).toBe(1);
  });
});
