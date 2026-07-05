import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ConfigService } from '../src/config/config.service';
import { applyHttpMiddleware } from '../src/http-setup';
import { TenantsService } from '../src/modules/tenants/tenants.service';
import { Tenant, TemplateVersion } from '@veyrasend/db';

describe('Phase 5 — versioned templates, preview, test send', () => {
  let app: INestApplication;
  let tenants: TenantsService;
  let ds: DataSource;
  let redisClient: { quit: () => Promise<void> };
  let tenantAId: string;
  let tenantBId: string;
  let aOwnerEmail: string;
  let bOwnerEmail: string;
  let templateId: string;

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
    aOwnerEmail = `a5-owner-${suffix}@test.veyrasend`;
    bOwnerEmail = `b5-owner-${suffix}@test.veyrasend`;
    const a = await tenants.createTenantWithOwner({ name: `A5 ${suffix}`, slug: `a5-${suffix}`, ownerEmail: aOwnerEmail, ownerPassword: 'a5-owner-password-123', ownerName: 'A5' });
    tenantAId = a.tenant.id;
    const b = await tenants.createTenantWithOwner({ name: `B5 ${suffix}`, slug: `b5-${suffix}`, ownerEmail: bOwnerEmail, ownerPassword: 'b5-owner-password-123', ownerName: 'B5' });
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
  async function csrf(a: supertest.SuperAgentTest) { return (await a.get('/api/auth/csrf').expect(200)).body.token; }

  it('creates a template, snapshots v1, and updates bump the version', async () => {
    const a = await loginAs(aOwnerEmail, 'a5-owner-password-123');
    const tp = await csrf(a);
    await a.post('/api/sendgrid/provision').set('x-csrf-token', tp).expect(200);
    const t1 = await csrf(a);
    const res = await a.post('/api/templates').set('x-csrf-token', t1).send({
      name: 'Welcome', subject: 'Hi {{first_name}}', html: '<p>{{first_name}}</p>',
      variables: [{ key: 'first_name', fallback: 'there' }],
    }).expect(201);
    templateId = res.body.id;
    expect(res.body.version).toBe(1);

    const t2 = await csrf(a);
    const updated = await a.patch(`/api/templates/${templateId}`).set('x-csrf-token', t2).send({ html: '<p>Hello {{first_name}}!</p>' }).expect(200);
    expect(updated.body.version).toBe(2);

    const versions = (await a.get(`/api/templates/${templateId}/versions`).expect(200)).body as Array<{ version: number }>;
    expect(versions.map((v) => v.version)).toEqual([2, 1]);

    const snaps = await ds.getRepository(TemplateVersion).find({ where: { tenantId: tenantAId, templateId } });
    expect(snaps.length).toBe(2);
  });

  it('renders a preview with variable substitution and fallbacks', async () => {
    const a = await loginAs(aOwnerEmail, 'a5-owner-password-123');
    const t = await csrf(a);
    const res = await a.post(`/api/templates/${templateId}/preview`).set('x-csrf-token', t).send({ vars: { first_name: 'Jane' } }).expect(200);
    expect(res.body.subject).toBe('Hi Jane');
    expect(res.body.html).toContain('Hello Jane!');

    const t2 = await csrf(a);
    const fallback = await a.post(`/api/templates/${templateId}/preview`).set('x-csrf-token', t2).send({ vars: {} }).expect(200);
    expect(fallback.body.subject).toBe('Hi there');
  });

  it('test-send enqueues a message that the worker delivers', async () => {
    const a = await loginAs(aOwnerEmail, 'a5-owner-password-123');
    const t = await csrf(a);
    const res = await a.post(`/api/templates/${templateId}/test-send`).set('x-csrf-token', t).send({ toEmail: 'someone@example.com', vars: { first_name: 'Jane' } }).expect(200);
    const messageId = res.body.messageId as string;
    expect(messageId).toBeTruthy();

    for (let i = 0; i < 40; i++) {
      const list = (await a.get('/api/messages').expect(200)).body as Array<{ id: string; status: string }>;
      const found = list.find((m) => m.id === messageId);
      if (found && found.status === 'sent') return;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error('test-send message did not reach sent status');
  });

  it('tenant B cannot see tenant A templates and a member cannot write', async () => {
    const b = await loginAs(bOwnerEmail, 'b5-owner-password-123');
    const list = (await b.get('/api/templates').expect(200)).body as Array<{ name: string }>;
    expect(list.find((t) => t.name === 'Welcome')).toBeUndefined();
    expect((await b.get(`/api/templates/${templateId}`)).status).toBe(404);

    // member RBAC
    const owner = await loginAs(aOwnerEmail, 'a5-owner-password-123');
    const t1 = await csrf(owner);
    const memberEmail = `a5-member-${tenantAId.slice(0, 4)}@test.veyrasend`;
    await owner.post('/api/users').set('x-csrf-token', t1).send({ email: memberEmail, password: 'a5-member-password-123', name: 'M', roleName: 'member' }).expect(201);
    const member = await loginAs(memberEmail, 'a5-member-password-123');
    expect((await member.get('/api/templates')).status).toBe(200); // member has templates:read
    const ts = await csrf(member);
    expect((await member.post('/api/templates').set('x-csrf-token', ts).send({ name: 'x', subject: 'y', html: '<p></p>' })).status).toBe(403);
  });
});
