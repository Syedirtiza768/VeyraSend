import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { TenantsService } from './modules/tenants/tenants.service';
import { ContactsService } from './modules/contacts/contacts.service';
import { TemplatesService } from './modules/templates/templates.service';
import { Tenant, Template } from '@veyrasend/db';
import { DataSource } from 'typeorm';

/**
 * Phase 11 — seed. Creates a demo tenant + owner and a small sample dataset
 * (contacts + a welcome template) for fresh-environment smoke testing. Idempotent:
 * re-running skips anything that already exists.
 *
 * Defaults (override via env if needed):
 *   DEMO_TENANT_SLUG, DEMO_OWNER_EMAIL, DEMO_OWNER_PASSWORD
 */
async function seed(): Promise<void> {
  const logger = new Logger('seed');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    const tenants = app.get(TenantsService);
    const contacts = app.get(ContactsService);
    const templates = app.get(TemplatesService);
    const ds = app.get('DATA_SOURCE' as never) as DataSource;

    const slug = process.env.DEMO_TENANT_SLUG ?? 'demo';
    const ownerEmail = (process.env.DEMO_OWNER_EMAIL ?? 'owner@demo.veyrasend').toLowerCase();
    const ownerPassword = process.env.DEMO_OWNER_PASSWORD ?? 'demo-owner-password-123';

    let tenant: Tenant;
    const existing = await ds.getRepository(Tenant).findOne({ where: { slug } });
    if (existing) {
      tenant = existing;
      logger.log(`Tenant '${slug}' already exists — reusing.`);
    } else {
      const created = await tenants.createTenantWithOwner({
        name: 'Demo Workspace',
        slug,
        ownerEmail,
        ownerPassword,
        ownerName: 'Demo Owner',
      });
      tenant = created.tenant;
      logger.log(`Created tenant '${slug}' with owner ${ownerEmail}.`);
    }

    // Sample contacts (idempotent upserts).
    const sample = [
      { email: 'ada@demo.example', firstName: 'Ada', lastName: 'Lovelace', customFields: { plan: 'pro' } },
      { email: 'grace@demo.example', firstName: 'Grace', lastName: 'Hopper', customFields: { plan: 'free' } },
      { email: 'linus@demo.example', firstName: 'Linus', lastName: 'Torvalds', customFields: { plan: 'pro' } },
    ];
    for (const c of sample) {
      await contacts.upsert(tenant.id, c);
    }
    logger.log(`Seeded ${sample.length} contacts.`);

    // Sample welcome template (skip if a template with this name exists).
    const existingTmpl = await ds.getRepository(Template).findOne({ where: { tenantId: tenant.id, name: 'Welcome' } });
    if (!existingTmpl) {
      await templates.create(tenant.id, {
        name: 'Welcome',
        subject: 'Welcome to VeyraSend, {{first_name}}!',
        html: '<h1>Hi {{first_name}}</h1><p>Thanks for joining. Your plan: <strong>{{plan}}</strong>.</p>',
        text: 'Hi {{first_name}} — thanks for joining. Your plan: {{plan}}.',
        generation: 'dynamic',
        variables: [{ key: 'first_name' }, { key: 'plan' }],
      });
      logger.log('Seeded Welcome template.');
    } else {
      logger.log('Welcome template already exists — skipping.');
    }

    logger.log('Seed complete.');
  } finally {
    await app.close();
  }
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
