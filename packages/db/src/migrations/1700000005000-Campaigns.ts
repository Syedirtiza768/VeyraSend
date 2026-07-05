import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 6 schema: campaigns. Stats are computed live from the message ledger
 * + event log (Phase 9 reconciliation), so the table stores only scheduling
 * state and a denormalized recipient count for quick listing. Tenant-scoped (RLS).
 */
export class Campaigns1700000005000 implements MigrationInterface {
  name = 'Campaigns1700000005000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "campaigns" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"     uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name"          varchar(120) NOT NULL,
        "template_id"   uuid NOT NULL,
        "segment_id"    uuid NOT NULL,
        "from_email"    varchar(255) NOT NULL,
        "from_name"     varchar(120) NULL,
        "subject"       varchar(255) NULL,
        "status"        varchar(20) NOT NULL DEFAULT 'draft',
        "scheduled_at"  timestamptz NULL,
        "started_at"    timestamptz NULL,
        "completed_at"  timestamptz NULL,
        "recipients"    int NOT NULL DEFAULT 0,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        "updated_at"    timestamptz NOT NULL DEFAULT now(),
        "deleted_at"    timestamptz NULL
      )
    `);
    await q.query(`CREATE INDEX idx_campaigns_tenant_id ON "campaigns" ("tenant_id")`);
    await q.query(`CREATE INDEX idx_campaigns_status ON "campaigns" ("status")`);
    await q.query(`ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY`);
    await q.query(
      `CREATE POLICY tenant_isolation_campaigns ON "campaigns"
       USING (tenant_id::text = current_setting('app.tenant_id', true))
       WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true))`,
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP POLICY IF EXISTS tenant_isolation_campaigns ON "campaigns"`);
    await q.query(`ALTER TABLE "campaigns" DISABLE ROW LEVEL SECURITY`);
    await q.query(`DROP TABLE IF EXISTS "campaigns"`);
  }
}
