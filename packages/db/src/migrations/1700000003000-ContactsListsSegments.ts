import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 4 schema: contacts, lists, list_memberships, segments, suppressions.
 * All tenant-scoped (tenant_id + indexes + RLS). Contacts use soft-delete so
 * re-imports revive rows instead of colliding on the (tenant_id, email) unique
 * constraint.
 */
export class ContactsListsSegments1700000003000 implements MigrationInterface {
  name = 'ContactsListsSegments1700000003000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "contacts" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"     uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "email"         varchar(255) NOT NULL,
        "first_name"    varchar(120) NULL,
        "last_name"     varchar(120) NULL,
        "status"        varchar(20) NOT NULL DEFAULT 'active',
        "custom_fields" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        "updated_at"    timestamptz NOT NULL DEFAULT now(),
        "deleted_at"    timestamptz NULL,
        CONSTRAINT contacts_tenant_email_unique UNIQUE (tenant_id, email)
      )
    `);
    await q.query(`CREATE INDEX idx_contacts_tenant_id ON "contacts" ("tenant_id")`);
    await q.query(`CREATE INDEX idx_contacts_deleted_at ON "contacts" ("deleted_at")`);

    await q.query(`
      CREATE TABLE "lists" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"  uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name"       varchar(120) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT lists_tenant_name_unique UNIQUE (tenant_id, name)
      )
    `);
    await q.query(`CREATE INDEX idx_lists_tenant_id ON "lists" ("tenant_id")`);

    await q.query(`
      CREATE TABLE "list_memberships" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"  uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "list_id"    uuid NOT NULL REFERENCES "lists"("id") ON DELETE CASCADE,
        "contact_id" uuid NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT list_memberships_tenant_list_contact_unique UNIQUE (tenant_id, list_id, contact_id)
      )
    `);
    await q.query(`CREATE INDEX idx_list_memberships_list_id ON "list_memberships" ("list_id")`);
    await q.query(`CREATE INDEX idx_list_memberships_contact_id ON "list_memberships" ("contact_id")`);

    await q.query(`
      CREATE TABLE "segments" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"  uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name"       varchar(120) NOT NULL,
        "definition" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT segments_tenant_name_unique UNIQUE (tenant_id, name)
      )
    `);
    await q.query(`CREATE INDEX idx_segments_tenant_id ON "segments" ("tenant_id")`);

    await q.query(`
      CREATE TABLE "suppressions" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"  uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "email"      varchar(255) NOT NULL,
        "reason"     varchar(20) NOT NULL,
        "source"     varchar(40) NOT NULL DEFAULT 'manual',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT suppressions_tenant_email_reason_unique UNIQUE (tenant_id, email, reason)
      )
    `);
    await q.query(`CREATE INDEX idx_suppressions_tenant_id ON "suppressions" ("tenant_id")`);
    await q.query(`CREATE INDEX idx_suppressions_email ON "suppressions" ("tenant_id", "email")`);

    for (const table of ['contacts', 'lists', 'list_memberships', 'segments', 'suppressions']) {
      await q.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await q.query(
        `CREATE POLICY tenant_isolation_${table} ON "${table}"
         USING (tenant_id::text = current_setting('app.tenant_id', true))
         WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true))`,
      );
    }
  }

  async down(q: QueryRunner): Promise<void> {
    for (const table of ['contacts', 'lists', 'list_memberships', 'segments', 'suppressions']) {
      await q.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON "${table}"`);
      await q.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
    await q.query(`DROP TABLE IF EXISTS "suppressions"`);
    await q.query(`DROP TABLE IF EXISTS "segments"`);
    await q.query(`DROP TABLE IF EXISTS "list_memberships"`);
    await q.query(`DROP TABLE IF EXISTS "lists"`);
    await q.query(`DROP TABLE IF EXISTS "contacts"`);
  }
}
