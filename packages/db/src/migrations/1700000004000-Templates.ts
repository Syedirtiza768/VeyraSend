import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 5 schema: templates (versioned) + template_versions (snapshots).
 * Tenant-scoped (RLS). Templates use soft-delete so re-creating a same-named
 * template revives the row.
 */
export class Templates1700000004000 implements MigrationInterface {
  name = 'Templates1700000004000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "templates" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"  uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name"       varchar(120) NOT NULL,
        "subject"    varchar(255) NOT NULL,
        "html"       text NOT NULL,
        "text"       text NULL,
        "generation" varchar(20) NOT NULL DEFAULT 'dynamic',
        "variables"  jsonb NOT NULL DEFAULT '[]'::jsonb,
        "version"    int NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT templates_tenant_name_unique UNIQUE (tenant_id, name)
      )
    `);
    await q.query(`CREATE INDEX idx_templates_tenant_id ON "templates" ("tenant_id")`);

    await q.query(`
      CREATE TABLE "template_versions" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"  uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "template_id" uuid NOT NULL REFERENCES "templates"("id") ON DELETE CASCADE,
        "version"    int NOT NULL,
        "subject"    varchar(255) NOT NULL,
        "html"       text NOT NULL,
        "text"       text NULL,
        "generation" varchar(20) NOT NULL,
        "variables"  jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_template_versions_template_id ON "template_versions" ("template_id")`);

    for (const table of ['templates', 'template_versions']) {
      await q.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await q.query(
        `CREATE POLICY tenant_isolation_${table} ON "${table}"
         USING (tenant_id::text = current_setting('app.tenant_id', true))
         WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true))`,
      );
    }
  }

  async down(q: QueryRunner): Promise<void> {
    for (const table of ['templates', 'template_versions']) {
      await q.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON "${table}"`);
      await q.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
    await q.query(`DROP TABLE IF EXISTS "template_versions"`);
    await q.query(`DROP TABLE IF EXISTS "templates"`);
  }
}
