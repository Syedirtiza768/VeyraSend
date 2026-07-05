import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 8 schema: automations + automation_enrollments. A welcome sequence is
 * defined as ordered steps (send / delay / branch) driven by a periodic ticker
 * that enrolls new contacts and advances due enrollments. Tenant-scoped (RLS).
 */
export class Automations1700000007000 implements MigrationInterface {
  name = 'Automations1700000007000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "automations" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"  uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name"       varchar(120) NOT NULL,
        "status"     varchar(20) NOT NULL DEFAULT 'paused',
        "definition" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await q.query(`CREATE INDEX idx_automations_tenant_id ON "automations" ("tenant_id")`);

    await q.query(`
      CREATE TABLE "automation_enrollments" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"     uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "automation_id" uuid NOT NULL REFERENCES "automations"("id") ON DELETE CASCADE,
        "contact_id"    uuid NOT NULL,
        "current_step"  int NOT NULL DEFAULT 0,
        "state"         varchar(20) NOT NULL DEFAULT 'active',
        "next_at"       timestamptz NOT NULL,
        "enrolled_at"   timestamptz NOT NULL,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        "updated_at"    timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_enrollments_automation_id ON "automation_enrollments" ("automation_id")`);
    await q.query(`CREATE INDEX idx_enrollments_state_next_at ON "automation_enrollments" ("state", "next_at")`);
    await q.query(`CREATE UNIQUE INDEX idx_enrollments_automation_contact ON "automation_enrollments" ("automation_id", "contact_id")`);

    for (const table of ['automations', 'automation_enrollments']) {
      await q.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await q.query(
        `CREATE POLICY tenant_isolation_${table} ON "${table}"
         USING (tenant_id::text = current_setting('app.tenant_id', true))
         WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true))`,
      );
    }
  }

  async down(q: QueryRunner): Promise<void> {
    for (const table of ['automations', 'automation_enrollments']) {
      await q.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON "${table}"`);
      await q.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
    await q.query(`DROP TABLE IF EXISTS "automation_enrollments"`);
    await q.query(`DROP TABLE IF EXISTS "automations"`);
  }
}
