import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { Contact, Conversation, Message, Tenant } from '@veyrasend/db';

describe('Phase 14 — Unified conversations', () => {
  let app: INestApplication;
  let tenants: TenantsService;
  let ds: DataSource;
  let redisClient: { quit: () => Promise<void> };
  let tenantId: string;
  let ownerEmail: string;
  let inboundSecret: string;

  beforeAll(async () => {
    const config = new ConfigService();
    inboundSecret = config.all.sendgrid.inboundParseSecret ?? 'test-inbound-secret';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api', { exclude: ['health', 'health/*'] });
    redisClient = applyHttpMiddleware(app, config.all) as unknown as { quit: () => Promise<void> };
    await app.init();

    tenants = app.get(TenantsService);
    ds = app.get('DATA_SOURCE' as never) as DataSource;

    const suffix = Math.random().toString(36).slice(2, 10);
    ownerEmail = `conv-${suffix}@test.veyrasend`;

    const t = await tenants.createTenantWithOwner({
      name: `Conv ${suffix}`,
      slug: `conv-${suffix}`,
      ownerEmail,
      ownerPassword: 'password-123',
      ownerName: 'Conv Owner',
    });
    tenantId = t.tenant.id;
  });

  afterAll(async () => {
    if (ds) await ds.getRepository(Tenant).delete(tenantId);
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

  it('unifies email and SMS in one conversation per contact', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    let csrf = (await a.get('/api/auth/csrf')).body.token;

    const contact = await a
      .post('/api/contacts')
      .set('x-csrf-token', csrf)
      .send({ email: 'unified@example.com', firstName: 'Unified', phone: '+15557778888' })
      .expect(201);

    await agent()
      .post(`/api/webhooks/inbound?secret=${encodeURIComponent(inboundSecret)}`)
      .send({ from: 'unified@example.com', to: 'inbox@example.com', subject: 'Question', text: 'Email reply body' })
      .expect(200);

    await a.post('/api/twilio/provision').set('x-csrf-token', csrf).expect(201);
    csrf = (await a.get('/api/auth/csrf')).body.token;
    const phone = await a
      .post('/api/phone-numbers')
      .set('x-csrf-token', csrf)
      .send({ e164Number: '+15551234999' })
      .expect(201);

    await a
      .post('/api/webhooks/twilio/sms')
      .set('x-twilio-signature', 'mock-valid-signature')
      .send({ From: '+15557778888', To: '+15551234999', Body: 'START', MessageSid: 'SMconv001' })
      .expect(200);

    await a
      .post('/api/webhooks/twilio/sms')
      .set('x-twilio-signature', 'mock-valid-signature')
      .send({ From: '+15557778888', To: '+15551234999', Body: 'SMS follow-up', MessageSid: 'SMconv002' })
      .expect(200);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const list = await a.get('/api/conversations').set('x-csrf-token', csrf).expect(200);
    expect(list.body.length).toBeGreaterThanOrEqual(1);

    const conv = list.body.find((c: { contactId: string }) => c.contactId === contact.body.id);
    expect(conv).toBeDefined();
    expect(conv.channels).toEqual(expect.arrayContaining(['email', 'sms']));

    const detail = await a.get(`/api/conversations/${conv.id}`).set('x-csrf-token', csrf).expect(200);
    expect(detail.body.messages.length).toBeGreaterThanOrEqual(2);
    const channels = detail.body.messages.map((m: { channel: string }) => m.channel);
    expect(channels).toEqual(expect.arrayContaining(['email', 'sms']));

    const emailOnly = await a.get('/api/conversations?channel=email').set('x-csrf-token', csrf).expect(200);
    expect(emailOnly.body.some((c: { id: string }) => c.id === conv.id)).toBe(true);
  });

  it('migrated inbound data integrity — one conversation per contact email', async () => {
    const contact = await ds.getRepository(Contact).findOne({ where: { tenantId, email: 'unified@example.com' } });
    expect(contact).toBeTruthy();
    const convs = await ds.getRepository(Conversation).find({ where: { tenantId, contactId: contact!.id } });
    expect(convs.length).toBe(1);
    const msgs = await ds.getRepository(Message).find({ where: { tenantId, conversationId: convs[0]!.id } });
    expect(msgs.length).toBeGreaterThanOrEqual(2);
  });

  it('supports internal notes and mark read', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    const csrf = (await a.get('/api/auth/csrf')).body.token;
    const list = await a.get('/api/conversations').set('x-csrf-token', csrf).expect(200);
    const convId = list.body[0]?.id;
    expect(convId).toBeTruthy();

    await a
      .post(`/api/conversations/${convId}/notes`)
      .set('x-csrf-token', csrf)
      .send({ body: 'Internal follow-up needed' })
      .expect(201);

    await a.post(`/api/conversations/${convId}/read`).set('x-csrf-token', csrf).expect(201);

    const detail = await a.get(`/api/conversations/${convId}`).set('x-csrf-token', csrf).expect(200);
    expect(detail.body.unread).toBe(false);
    expect(detail.body.notes.some((n: { body: string }) => n.body.includes('Internal'))).toBe(true);
  });
});
