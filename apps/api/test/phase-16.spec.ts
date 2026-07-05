import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { Contact, FormSubmission, ReviewRequest, Tenant } from '@veyrasend/db';

describe('Phase 16 — Calendar, forms, funnels, reputation', () => {
  let app: INestApplication;
  let tenants: TenantsService;
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
    ds = app.get('DATA_SOURCE' as never) as DataSource;
    const suffix = Math.random().toString(36).slice(2, 10);
    ownerEmail = `p16-${suffix}@test.veyrasend`;
    const t = await tenants.createTenantWithOwner({
      name: `P16 ${suffix}`, slug: `p16-${suffix}`, ownerEmail,
      ownerPassword: 'password-123', ownerName: 'P16 Owner',
    });
    tenantId = t.tenant.id;
  });

  afterAll(async () => {
    if (ds) await ds.getRepository(Tenant).delete(tenantId);
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

  it('public booking creates appointment and fires workflow trigger path', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    let csrf = (await a.get('/api/auth/csrf')).body.token;
    const cal = await a.post('/api/calendar').set('x-csrf-token', csrf).send({ name: 'Sales calls' }).expect(201);
    csrf = (await a.get('/api/auth/csrf')).body.token;
    await a.patch(`/api/calendar/${cal.body.id}/availability`).set('x-csrf-token', csrf).send({
      availability: { monday: [{ start: '09:00', end: '17:00' }] },
    }).expect(200);

    const from = new Date();
    from.setUTCDate(from.getUTCDate() + ((1 + 7 - from.getUTCDay()) % 7 || 7));
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 1);

    const slots = await agent()
      .get(`/api/calendar/${cal.body.bookingSlug}/public-slots?from=${from.toISOString()}&to=${to.toISOString()}`)
      .expect(200);
    expect(slots.body.slots.length).toBeGreaterThan(0);

    const slot = slots.body.slots[0] as { startsAt: string };
    const book = await agent().post('/api/appointments').send({
      calendarSlug: cal.body.bookingSlug,
      contactEmail: 'booked@example.com',
      startsAt: slot.startsAt,
    }).expect(201);
    expect(book.body.contactId).toBeTruthy();

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const list = await a.get('/api/appointments').set('x-csrf-token', csrf).expect(200);
    expect(list.body.some((x: { id: string }) => x.id === book.body.id)).toBe(true);
  });

  it('form submission creates contact with UTM; honeypot logged as spam', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    let csrf = (await a.get('/api/auth/csrf')).body.token;
    const form = await a.post('/api/forms').set('x-csrf-token', csrf).send({ name: 'Lead form' }).expect(201);
    csrf = (await a.get('/api/auth/csrf')).body.token;
    await a.patch(`/api/forms/${form.body.id}/fields`).set('x-csrf-token', csrf).send({
      fields: [{ label: 'Email', fieldKey: 'email', fieldType: 'email', required: true, position: 0 }],
    }).expect(200);

    const ok = await agent().post(`/api/forms/${form.body.id}/submit`).send({
      email: 'lead@example.com',
      utm: { utm_source: 'google', utm_campaign: 'spring' },
    }).expect(201);
    expect(ok.body.ok).toBe(true);

    const contact = await ds.getRepository(Contact).findOne({ where: { tenantId, email: 'lead@example.com' } });
    expect(contact?.leadSource).toBe('google');

    await agent().post(`/api/forms/${form.body.id}/submit`).send({
      email: 'spam@example.com',
      _honeypot: 'bot-filled-this',
    }).expect(201);

    const spam = await ds.getRepository(FormSubmission).findOne({ where: { tenantId, formId: form.body.id, isSpam: true } });
    expect(spam).toBeTruthy();
  });

  it('unpublished landing page returns not available', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    let csrf = (await a.get('/api/auth/csrf')).body.token;
    const page = await a.post('/api/funnels/pages').set('x-csrf-token', csrf).send({ name: 'Draft LP' }).expect(201);
    const res = await agent().get(`/api/funnels/pages/${page.body.slug}`).expect(200);
    expect(res.body.available).toBe(false);
  });

  it('review request link click updates status', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    let csrf = (await a.get('/api/auth/csrf')).body.token;
    await a.patch('/api/reputation/settings').set('x-csrf-token', csrf).send({
      googleReviewLink: 'https://g.page/r/example/review',
    }).expect(200);
    csrf = (await a.get('/api/auth/csrf')).body.token;
    const contact = await a.post('/api/contacts').set('x-csrf-token', csrf).send({
      email: 'review@example.com', firstName: 'Review',
    }).expect(201);
    await a.post('/api/sendgrid/provision').set('x-csrf-token', csrf).expect(200);
    csrf = (await a.get('/api/auth/csrf')).body.token;
    const req = await a.post('/api/reputation/requests').set('x-csrf-token', csrf).send({
      contactId: contact.body.id, channel: 'email',
    }).expect(201);

    await agent().get(`/api/reputation/r/${req.body.id}`).expect(302);
    const row = await ds.getRepository(ReviewRequest).findOne({ where: { id: req.body.id, tenantId } });
    expect(row?.status).toBe('clicked');
  });
});
