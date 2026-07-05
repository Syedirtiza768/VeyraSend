import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 10 schema: tenant_settings. One row per tenant holding the optional
 * webhook verification-key override and retention windows (in days). RLS-enforced.
 */
export class TenantSettings1700000008000 implements MigrationInterface {
  name = 'TenantSettings1700000008000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "tenant_settings" (
        "id"                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"                   uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "webhook_verification_key"    text NULL,
        "event_retention_days"        int NOT NULL DEFAULT 90,
        "message_retention_days"      int NOT NULL DEFAULT 365,
        "inbound_retention_days"      int NOT NULL DEFAULT 90,
        "updated_at"                  timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE UNIQUE INDEX idx_tenant_settings_tenant_id ON "tenant_settings" ("tenant_id")`);
    await q.query(`ALTER TABLE "tenant_settings" ENABLE ROW LEVEL SECURITY`);
    await q.query(
      `CREATE POLICY tenant_isolation_tenant_settings ON "tenant_settings"
       USING (tenant_id::text = current_setting('app.tenant_id', true))
       WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true))`,
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP POLICY IF EXISTS tenant_isolation_tenant_settings ON "tenant_settings"`);
    await q.query(`ALTER TABLE "tenant_settings" DISABLE ROW LEVEL SECURITY`);
    await q.query(`DROP TABLE IF EXISTS "tenant_settings"`);
  }
}
