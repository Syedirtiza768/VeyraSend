import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { Tenant } from '@veyrasend/db';

describe('Phase 12 — CRM core', () => {
  let app: INestApplication;
  let tenants: TenantsService;
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
    ds = app.get('DATA_SOURCE' as never) as DataSource;

    const suffix = Math.random().toString(36).slice(2, 10);
    aOwnerEmail = `crm-a-${suffix}@test.veyrasend`;
    bOwnerEmail = `crm-b-${suffix}@test.veyrasend`;
    aMemberEmail = `crm-member-${suffix}@test.veyrasend`;

    const a = await tenants.createTenantWithOwner({
      name: `CRM A ${suffix}`, slug: `crm-a-${suffix}`,
      ownerEmail: aOwnerEmail, ownerPassword: 'password-123', ownerName: 'A Owner',
    });
    tenantAId = a.tenant.id;

    const b = await tenants.createTenantWithOwner({
      name: `CRM B ${suffix}`, slug: `crm-b-${suffix}`,
      ownerEmail: bOwnerEmail, ownerPassword: 'password-123', ownerName: 'B Owner',
    });
    tenantBId = b.tenant.id;

    const aAgent = supertest.agent(app.getHttpServer());
    let csrf = (await aAgent.get('/api/auth/csrf').expect(200)).body.token;
    await aAgent.post('/api/auth/login').set('x-csrf-token', csrf).send({ email: aOwnerEmail, password: 'password-123' });

    csrf = (await aAgent.get('/api/auth/csrf').expect(200)).body.token;
    await aAgent.post('/api/users').set('x-csrf-token', csrf).send({
      email: aMemberEmail, password: 'member-pass-123', name: 'Member', roleName: 'member',
    }).expect(201);
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

  it('creates company, pipeline, deal, task, note — tenant isolated', async () => {
    const a = await loginAs(aOwnerEmail, 'password-123');
    const csrf = (await a.get('/api/auth/csrf')).body.token;

    const company = await a.post('/api/companies').set('x-csrf-token', csrf)
      .send({ name: 'Acme Corp' }).expect(201);
    expect(company.body.name).toBe('Acme Corp');

    const pipeline = await a.post('/api/pipelines').set('x-csrf-token', csrf).send({
      name: 'Sales',
      stages: [{ name: 'New', position: 0 }, { name: 'Won', position: 1, isWon: true }],
    }).expect(201);
    const stageId = pipeline.body.stages[0].id;

    const contact = await a.post('/api/contacts').set('x-csrf-token', csrf)
      .send({ email: `deal-contact-${Date.now()}@test.com`, companyId: company.body.id }).expect(201);

    const deal = await a.post('/api/deals').set('x-csrf-token', csrf).send({
      pipelineId: pipeline.body.id, stageId, name: 'Big Deal', contactId: contact.body.id,
    }).expect(201);

    await a.post('/api/tasks').set('x-csrf-token', csrf).send({
      title: 'Follow up', entityType: 'contact', entityId: contact.body.id,
    }).expect(201);

    await a.post('/api/notes').set('x-csrf-token', csrf).send({
      body: 'Called them', entityType: 'deal', entityId: deal.body.id,
    }).expect(201);

    const timeline = await a.get(`/api/contacts/${contact.body.id}/timeline`).expect(200);
    expect(Array.isArray(timeline.body)).toBe(true);
    expect(timeline.body.length).toBeGreaterThan(0);

    const b = await loginAs(bOwnerEmail, 'password-123');
    await b.get(`/api/companies/${company.body.id}`).expect(404);
    await b.get(`/api/deals/${deal.body.id}`).expect(404);
  });

  it('rejects task with invalid entity (polymorphic FK)', async () => {
    const a = await loginAs(aOwnerEmail, 'password-123');
    const csrf = (await a.get('/api/auth/csrf')).body.token;
    await a.post('/api/tasks').set('x-csrf-token', csrf).send({
      title: 'Bad', entityType: 'contact', entityId: '00000000-0000-4000-8000-000000000000',
    }).expect(400);
  });

  it('deal move writes audit-friendly stage change', async () => {
    const a = await loginAs(aOwnerEmail, 'password-123');
    const csrf = (await a.get('/api/auth/csrf')).body.token;

    const pipeline = await a.post('/api/pipelines').set('x-csrf-token', csrf).send({
      name: 'Move Test',
      stages: [{ name: 'A', position: 0 }, { name: 'B', position: 1 }],
    }).expect(201);
    const deal = await a.post('/api/deals').set('x-csrf-token', csrf).send({
      pipelineId: pipeline.body.id, stageId: pipeline.body.stages[0].id, name: 'Move Me',
    }).expect(201);

    await a.post(`/api/deals/${deal.body.id}/move`).set('x-csrf-token', csrf)
      .send({ stageId: pipeline.body.stages[1].id }).expect(201);

    const updated = await a.get(`/api/deals/${deal.body.id}`).expect(200);
    expect(updated.body.stageId).toBe(pipeline.body.stages[1].id);
  });

  it('member cannot create companies (RBAC)', async () => {
    const a = await loginAs(aMemberEmail, 'member-pass-123');
    const csrf = (await a.get('/api/auth/csrf')).body.token;
    await a.post('/api/companies').set('x-csrf-token', csrf).send({ name: 'Nope' }).expect(403);
  });
});
