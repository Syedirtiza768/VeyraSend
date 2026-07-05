import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { Invoice, Tenant, WorkflowRun } from '@veyrasend/db';

describe('Phase 17 — Stripe billing', () => {
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
    ownerEmail = `p17-${suffix}@test.veyrasend`;
    const t = await tenants.createTenantWithOwner({
      name: `P17 ${suffix}`, slug: `p17-${suffix}`, ownerEmail,
      ownerPassword: 'password-123', ownerName: 'P17 Owner',
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

  function stripeEvent(metadata: Record<string, string>, amountTotal = 5000) {
    return {
      id: `evt_${Math.random().toString(36).slice(2, 10)}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_mock',
          amount_total: amountTotal,
          metadata,
        },
      },
    };
  }

  it('rejects tampered Stripe webhook signature', async () => {
    await agent()
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'bad-signature')
      .send(stripeEvent({ tenant_id: tenantId, invoice_id: 'x', kind: 'invoice' }))
      .expect(400);
  });

  it('invoice paid only via webhook; invoice.paid workflow fires', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    let csrf = (await a.get('/api/auth/csrf')).body.token;

    await a.post('/api/sendgrid/provision').set('x-csrf-token', csrf).expect(200);
    csrf = (await a.get('/api/auth/csrf')).body.token;

    const contact = await a.post('/api/contacts').set('x-csrf-token', csrf).send({
      email: `p17-contact-${Math.random().toString(36).slice(2, 8)}@test.veyrasend`,
      firstName: 'Pay',
    }).expect(201);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const tpl = await a.post('/api/templates').set('x-csrf-token', csrf).send({
      name: 'Paid notice',
      subject: 'Thanks for paying',
      html: '<p>Paid</p>',
      variables: [],
    }).expect(201);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const wf = await a.post('/api/workflows').set('x-csrf-token', csrf).send({
      name: 'On invoice paid',
      definition: {
        trigger: { type: 'invoice.paid' },
        steps: [
          { type: 'send_email', templateId: tpl.body.id, fromEmail: 'billing@p17.test' },
          { type: 'stop' },
        ],
      },
    }).expect(201);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    await a.post(`/api/workflows/${wf.body.id}/publish`).set('x-csrf-token', csrf).expect(201);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const inv = await a.post('/api/billing/invoices').set('x-csrf-token', csrf).send({
      contactId: contact.body.id,
      lineItems: [{ description: 'Consulting', quantity: 1, unitAmountCents: 5000 }],
    }).expect(201);
    expect(inv.body.status).toBe('draft');

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const sent = await a.post(`/api/billing/invoices/${inv.body.id}/send`).set('x-csrf-token', csrf).expect(200);
    expect(sent.body.status).toBe('sent');
    expect(sent.body.paymentUrl).toBeTruthy();

    // Client cannot mark paid directly
    const row = await ds.getRepository(Invoice).findOne({ where: { id: inv.body.id } });
    expect(row?.status).toBe('sent');

    const event = stripeEvent({
      tenant_id: tenantId,
      invoice_id: inv.body.id,
      kind: 'invoice',
    }, 5000);

    await agent()
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'mock-valid-signature')
      .send(event)
      .expect(200);

    const paid = await ds.getRepository(Invoice).findOne({ where: { id: inv.body.id } });
    expect(paid?.status).toBe('paid');
    expect(paid?.paidAt).toBeTruthy();

    await new Promise((r) => setTimeout(r, 1500));
    const runs = await ds.getRepository(WorkflowRun).find({ where: { tenantId, workflowId: wf.body.id } });
    expect(runs.length).toBeGreaterThan(0);
  });

  it('creates standalone payment link', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    const csrf = (await a.get('/api/auth/csrf')).body.token;
    const link = await a.post('/api/billing/payment-links').set('x-csrf-token', csrf).send({
      amountCents: 2500,
      description: 'Text-to-pay',
    }).expect(201);
    expect(link.body.paymentUrl).toContain('stripe.mock');
    expect(link.body.status).toBe('pending');
  });
});
