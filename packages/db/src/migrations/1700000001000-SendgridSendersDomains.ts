import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 2 schema: tenant_sendgrid_settings, senders, domains.
 * All tenant-scoped (tenant_id + indexes + RLS policies, ADR-0002).
 */
export class SendgridSendersDomains1700000001000 implements MigrationInterface {
  name = 'SendgridSendersDomains1700000001000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "tenant_sendgrid_settings" (
        "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"          uuid NOT NULL UNIQUE REFERENCES "tenants"("id") ON DELETE CASCADE,
        "subuser_username"   varchar(120) NOT NULL,
        "subuser_id"         varchar(255) NOT NULL,
        "encrypted_api_key"  text NOT NULL,
        "api_key_id"         varchar(60) NULL,
        "region"             varchar(40) NOT NULL DEFAULT 'mock',
        "created_at"         timestamptz NOT NULL DEFAULT now(),
        "updated_at"         timestamptz NOT NULL DEFAULT now()
      )
    `);

    await q.query(`
      CREATE TABLE "senders" (
        "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"           uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "sender_id"           varchar(255) NOT NULL,
        "from_email"          varchar(255) NOT NULL,
        "from_name"           varchar(120) NULL,
        "reply_to"            varchar(255) NOT NULL,
        "nickname"            varchar(120) NULL,
        "verified"            boolean NOT NULL DEFAULT false,
        "verification_status" varchar(20) NOT NULL DEFAULT 'pending',
        "created_at"          timestamptz NOT NULL DEFAULT now(),
        "updated_at"          timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT senders_tenant_email_unique UNIQUE (tenant_id, from_email)
      )
    `);
    await q.query(`CREATE INDEX idx_senders_tenant_id ON "senders" ("tenant_id")`);

    await q.query(`
      CREATE TABLE "domains" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"  uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "domain_id"  varchar(255) NOT NULL,
        "domain"     varchar(255) NOT NULL,
        "verified"   boolean NOT NULL DEFAULT false,
        "dns"        jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT domains_tenant_domain_unique UNIQUE (tenant_id, domain)
      )
    `);
    await q.query(`CREATE INDEX idx_domains_tenant_id ON "domains" ("tenant_id")`);

    // RLS defense-in-depth (enabled, not forced).
    for (const table of ['tenant_sendgrid_settings', 'senders', 'domains']) {
      await q.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await q.query(
        `CREATE POLICY tenant_isolation_${table} ON "${table}"
         USING (tenant_id::text = current_setting('app.tenant_id', true))
         WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true))`,
      );
    }
  }

  async down(q: QueryRunner): Promise<void> {
    for (const table of ['tenant_sendgrid_settings', 'senders', 'domains']) {
      await q.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON "${table}"`);
      await q.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
    await q.query(`DROP TABLE IF EXISTS "domains"`);
    await q.query(`DROP TABLE IF EXISTS "senders"`);
    await q.query(`DROP TABLE IF EXISTS "tenant_sendgrid_settings"`);
  }
}
