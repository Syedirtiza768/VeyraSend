import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { Contact, Tenant } from '@veyrasend/db';

describe('Phase 13 — Twilio SMS/Phone + inbound hardening', () => {
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
    ownerEmail = `twilio-${suffix}@test.veyrasend`;

    const t = await tenants.createTenantWithOwner({
      name: `Twilio ${suffix}`,
      slug: `twilio-${suffix}`,
      ownerEmail,
      ownerPassword: 'password-123',
      ownerName: 'Twilio Owner',
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

  it('provisions Twilio, buys a number, sends SMS after START, STOP blocks send', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    let csrf = (await a.get('/api/auth/csrf')).body.token;

    await a.post('/api/twilio/provision').set('x-csrf-token', csrf).expect(201);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const phone = await a
      .post('/api/phone-numbers')
      .set('x-csrf-token', csrf)
      .send({ e164Number: '+15551234001' })
      .expect(201);

    const contactPhone = '+15559876543';
    await a
      .post('/api/webhooks/twilio/sms')
      .set('x-twilio-signature', 'mock-valid-signature')
      .send({ From: contactPhone, To: '+15551234001', Body: 'START', MessageSid: 'SMstart001' })
      .expect(200);

    const contacts = await ds.getRepository(Contact).find({ where: { tenantId, phone: contactPhone } });
    expect(contacts.length).toBe(1);
    const contactId = contacts[0]!.id;

    csrf = (await a.get('/api/auth/csrf')).body.token;
    await a
      .post('/api/sms/send')
      .set('x-csrf-token', csrf)
      .send({ contactId, fromNumberId: phone.body.id, body: 'Hello from VeyraSend' })
      .expect(201);

    await a
      .post('/api/webhooks/twilio/sms')
      .set('x-twilio-signature', 'mock-valid-signature')
      .send({ From: contactPhone, To: '+15551234001', Body: 'STOP', MessageSid: 'SMstop001' })
      .expect(200);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    await a
      .post('/api/sms/send')
      .set('x-csrf-token', csrf)
      .send({ contactId, fromNumberId: phone.body.id, body: 'Should be blocked' })
      .expect(422);
  });

  it('rejects inbound parse without valid secret', async () => {
    await agent()
      .post('/api/webhooks/inbound')
      .send({ from: 'sender@example.com', to: 'inbox@example.com', subject: 'Hi', text: 'body' })
      .expect(403);

    await agent()
      .post(`/api/webhooks/inbound?secret=${encodeURIComponent(inboundSecret)}`)
      .send({ from: 'sender@example.com', to: 'inbox@example.com', subject: 'Hi', text: 'body' })
      .expect(200);
  });

  it('rejects tampered Twilio webhook signature', async () => {
    await agent()
      .post('/api/webhooks/twilio/sms')
      .set('x-twilio-signature', 'bad-signature')
      .send({ From: '+15551112222', To: '+15551234001', Body: 'Hi', MessageSid: 'SMbad001' })
      .expect(403);
  });

  it('logs inbound call and missed-call status callback', async () => {
    const a = await loginAs(ownerEmail, 'password-123');

    const voiceRes = await a
      .post('/api/webhooks/twilio/voice')
      .set('x-twilio-signature', 'mock-valid-signature')
      .send({ From: '+15559876543', To: '+15551234001', CallSid: 'CAinbound001' })
      .expect(200);

    expect(String(voiceRes.text)).toContain('Response');

    await a
      .post('/api/webhooks/twilio/voice/status')
      .set('x-twilio-signature', 'mock-valid-signature')
      .send({
        CallSid: 'CAinbound001',
        CallStatus: 'no-answer',
        To: '+15551234001',
        From: '+15559876543',
      })
      .expect(200);

    const csrf = (await a.get('/api/auth/csrf')).body.token;
    const calls = await a.get('/api/calls').set('x-csrf-token', csrf).expect(200);
    expect(calls.body.some((c: { twilioCallSid?: string; status: string }) => c.status === 'no-answer')).toBe(true);
  });
});
