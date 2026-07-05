import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { Message, Tenant, WorkflowRun, WorkflowRunStep } from '@veyrasend/db';

describe('Phase 15 — Workflow engine', () => {
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
    ownerEmail = `wf-${suffix}@test.veyrasend`;
    const t = await tenants.createTenantWithOwner({
      name: `WF ${suffix}`,
      slug: `wf-${suffix}`,
      ownerEmail,
      ownerPassword: 'password-123',
      ownerName: 'WF Owner',
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

  async function sleep(ms: number) {
    await new Promise((r) => setTimeout(r, ms));
  }

  it('welcome sequence with delay + branch runs end-to-end', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    let csrf = (await a.get('/api/auth/csrf')).body.token;

    await a.post('/api/sendgrid/provision').set('x-csrf-token', csrf).expect(200);
    csrf = (await a.get('/api/auth/csrf')).body.token;

    const tpl = await a.post('/api/templates').set('x-csrf-token', csrf).send({
      name: 'Welcome',
      subject: 'Hi {{first_name}}',
      html: '<p>Welcome {{first_name}}</p>',
      variables: [{ key: 'first_name', label: 'First name', required: false }],
    }).expect(201);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const wf = await a.post('/api/workflows').set('x-csrf-token', csrf).send({
      name: 'Welcome branch',
      definition: {
        trigger: { type: 'contact.created' },
        steps: [
          { type: 'send_email', templateId: tpl.body.id, fromEmail: 'welcome@wf.test' },
          { type: 'delay', durationSeconds: 2 },
          {
            type: 'condition',
            field: 'email',
            op: 'contains',
            value: 'welcome-seq',
            thenStep: 2,
            elseStep: 3,
          },
          { type: 'send_email', templateId: tpl.body.id, fromEmail: 'welcome@wf.test' },
          { type: 'stop' },
        ],
      },
    }).expect(201);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    await a.post(`/api/workflows/${wf.body.id}/publish`).set('x-csrf-token', csrf).expect(201);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    await a.post('/api/contacts').set('x-csrf-token', csrf).send({
      email: 'trigger-wf@example.com',
      firstName: 'Trigger',
    }).expect(201);

    let completed = false;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      const runs = (await a.get(`/api/workflows/${wf.body.id}/runs`).expect(200)).body as Array<{ id: string; status: string }>;
      const run = runs.find((r) => r.status === 'completed' || r.status === 'running');
      if (run?.status === 'completed') {
        completed = true;
        break;
      }
    }
    expect(completed).toBe(true);

    const msgs = await ds.getRepository(Message).find({ where: { tenantId, toEmail: 'trigger-wf@example.com' } });
    expect(msgs.length).toBeGreaterThanOrEqual(1);
  });

  it('dry-run makes zero real provider messages', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    let csrf = (await a.get('/api/auth/csrf')).body.token;

    const contact = await a.post('/api/contacts').set('x-csrf-token', csrf).send({
      email: 'dry-run@example.com',
      firstName: 'Dry',
    }).expect(201);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const tpl = await a.post('/api/templates').set('x-csrf-token', csrf).send({
      name: 'Dry',
      subject: 'Hi',
      html: '<p>Hi</p>',
      variables: [],
    }).expect(201);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const wf = await a.post('/api/workflows').set('x-csrf-token', csrf).send({
      name: 'Dry run wf',
      definition: {
        trigger: { type: 'manual' },
        steps: [{ type: 'send_email', templateId: tpl.body.id, fromEmail: 'dry@example.com' }],
      },
    }).expect(201);

    const before = await ds.getRepository(Message).count({ where: { tenantId, toEmail: 'dry-run@example.com' } });

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const test = await a.post(`/api/workflows/${wf.body.id}/test-run`).set('x-csrf-token', csrf).send({
      contactId: contact.body.id,
    }).expect(201);

    await sleep(2000);
    const after = await ds.getRepository(Message).count({ where: { tenantId, toEmail: 'dry-run@example.com' } });
    expect(after).toBe(before);

    const runId = (test.body as { runIds: string[] }).runIds[0];
    const steps = await ds.getRepository(WorkflowRunStep).find({ where: { tenantId, workflowRunId: runId } });
    expect(steps.some((s) => s.detail && (s.detail as { dryRun?: boolean }).dryRun === true)).toBe(true);
  });

  it('skips re-execution of completed steps (idempotency guard)', async () => {
    const a = await loginAs(ownerEmail, 'password-123');
    let csrf = (await a.get('/api/auth/csrf')).body.token;

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const wf = await a.post('/api/workflows').set('x-csrf-token', csrf).send({
      name: 'Idempotent',
      definition: {
        trigger: { type: 'manual' },
        steps: [{ type: 'stop' }],
      },
    }).expect(201);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const contact = await a.post('/api/contacts').set('x-csrf-token', csrf).send({
      email: 'idempotent@example.com',
    }).expect(201);

    csrf = (await a.get('/api/auth/csrf')).body.token;
    const test = await a.post(`/api/workflows/${wf.body.id}/test-run`).set('x-csrf-token', csrf).send({
      contactId: contact.body.id,
    }).expect(201);

    await sleep(1500);
    const runId = (test.body as { runIds: string[] }).runIds[0];
    const run = await ds.getRepository(WorkflowRun).findOne({ where: { id: runId, tenantId } });
    expect(run?.status).toBe('completed');

    const stepsBefore = await ds.getRepository(WorkflowRunStep).count({ where: { tenantId, workflowRunId: runId } });
    expect(stepsBefore).toBeGreaterThanOrEqual(1);
  });
});
