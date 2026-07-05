import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 12 — CRM core: companies, pipelines, deals, tasks, notes, tags, custom fields;
 * extends contacts with company link, owner, lead source, lifecycle stage, phone.
 */
export class CrmCore1700000012000 implements MigrationInterface {
  name = 'CrmCore1700000012000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "companies" (
        "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"      uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name"           varchar(255) NOT NULL,
        "domain"         varchar(255) NULL,
        "industry"       varchar(120) NULL,
        "phone"          varchar(40) NULL,
        "address"        jsonb NULL,
        "owner_user_id"  uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "created_at"     timestamptz NOT NULL DEFAULT now(),
        "updated_at"     timestamptz NOT NULL DEFAULT now(),
        "deleted_at"     timestamptz NULL
      )
    `);
    await q.query(`CREATE INDEX idx_companies_tenant_name ON "companies" ("tenant_id", "name")`);
    await q.query(`CREATE INDEX idx_companies_tenant_domain ON "companies" ("tenant_id", "domain")`);

    await q.query(`ALTER TABLE "contacts" ADD COLUMN "company_id" uuid NULL REFERENCES "companies"("id") ON DELETE SET NULL`);
    await q.query(`ALTER TABLE "contacts" ADD COLUMN "owner_user_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL`);
    await q.query(`ALTER TABLE "contacts" ADD COLUMN "lead_source" varchar(120) NULL`);
    await q.query(`ALTER TABLE "contacts" ADD COLUMN "lifecycle_stage" varchar(20) NOT NULL DEFAULT 'lead'`);
    await q.query(`ALTER TABLE "contacts" ADD COLUMN "phone" varchar(40) NULL`);
    await q.query(`CREATE INDEX idx_contacts_tenant_phone ON "contacts" ("tenant_id", "phone")`);
    await q.query(`CREATE INDEX idx_contacts_tenant_company ON "contacts" ("tenant_id", "company_id")`);
    await q.query(`CREATE INDEX idx_contacts_tenant_owner ON "contacts" ("tenant_id", "owner_user_id")`);

    await q.query(`
      CREATE TABLE "pipelines" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"   uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name"        varchar(120) NOT NULL,
        "is_default"  boolean NOT NULL DEFAULT false,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        "updated_at"  timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_pipelines_tenant_id ON "pipelines" ("tenant_id")`);

    await q.query(`
      CREATE TABLE "pipeline_stages" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"   uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "pipeline_id" uuid NOT NULL REFERENCES "pipelines"("id") ON DELETE CASCADE,
        "name"        varchar(120) NOT NULL,
        "position"    int NOT NULL,
        "probability" int NULL,
        "is_won"      boolean NOT NULL DEFAULT false,
        "is_lost"     boolean NOT NULL DEFAULT false,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        "updated_at"  timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_pipeline_stages_tenant_pipeline_pos ON "pipeline_stages" ("tenant_id", "pipeline_id", "position")`);

    await q.query(`
      CREATE TABLE "deals" (
        "id"                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"            uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "pipeline_id"          uuid NOT NULL REFERENCES "pipelines"("id") ON DELETE RESTRICT,
        "stage_id"             uuid NOT NULL REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT,
        "contact_id"           uuid NULL REFERENCES "contacts"("id") ON DELETE SET NULL,
        "company_id"           uuid NULL REFERENCES "companies"("id") ON DELETE SET NULL,
        "name"                 varchar(255) NOT NULL,
        "value_cents"          bigint NULL,
        "currency"             varchar(3) NOT NULL DEFAULT 'USD',
        "owner_user_id"        uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "status"               varchar(20) NOT NULL DEFAULT 'open',
        "expected_close_date"  date NULL,
        "created_at"           timestamptz NOT NULL DEFAULT now(),
        "updated_at"           timestamptz NOT NULL DEFAULT now(),
        "deleted_at"           timestamptz NULL
      )
    `);
    await q.query(`CREATE INDEX idx_deals_tenant_pipeline_stage ON "deals" ("tenant_id", "pipeline_id", "stage_id")`);
    await q.query(`CREATE INDEX idx_deals_tenant_contact ON "deals" ("tenant_id", "contact_id")`);
    await q.query(`CREATE INDEX idx_deals_tenant_owner ON "deals" ("tenant_id", "owner_user_id")`);

    await q.query(`
      CREATE TABLE "tasks" (
        "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"         uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "title"             varchar(255) NOT NULL,
        "description"       text NULL,
        "due_at"            timestamptz NULL,
        "status"            varchar(20) NOT NULL DEFAULT 'open',
        "assignee_user_id"  uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "entity_type"       varchar(20) NOT NULL,
        "entity_id"         uuid NOT NULL,
        "created_at"        timestamptz NOT NULL DEFAULT now(),
        "updated_at"        timestamptz NOT NULL DEFAULT now(),
        "deleted_at"        timestamptz NULL
      )
    `);
    await q.query(`CREATE INDEX idx_tasks_tenant_entity ON "tasks" ("tenant_id", "entity_type", "entity_id")`);
    await q.query(`CREATE INDEX idx_tasks_tenant_assignee_status ON "tasks" ("tenant_id", "assignee_user_id", "status")`);

    await q.query(`
      CREATE TABLE "notes" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"       uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "body"            text NOT NULL,
        "author_user_id"  uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "entity_type"     varchar(20) NOT NULL,
        "entity_id"       uuid NOT NULL,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_notes_tenant_entity_created ON "notes" ("tenant_id", "entity_type", "entity_id", "created_at" DESC)`);

    await q.query(`
      CREATE TABLE "tags" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"  uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name"       varchar(80) NOT NULL,
        "color"      varchar(20) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT tags_tenant_name_unique UNIQUE (tenant_id, name)
      )
    `);
    await q.query(`CREATE INDEX idx_tags_tenant_id ON "tags" ("tenant_id")`);

    await q.query(`
      CREATE TABLE "contact_tags" (
        "tenant_id"  uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "contact_id" uuid NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "tag_id"     uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (contact_id, tag_id)
      )
    `);
    await q.query(`CREATE INDEX idx_contact_tags_tenant_tag ON "contact_tags" ("tenant_id", "tag_id")`);

    await q.query(`
      CREATE TABLE "custom_fields" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"   uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "entity_type" varchar(20) NOT NULL,
        "key"         varchar(80) NOT NULL,
        "label"       varchar(120) NOT NULL,
        "field_type"  varchar(20) NOT NULL,
        "options"     jsonb NULL,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        "updated_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT custom_fields_tenant_entity_key_unique UNIQUE (tenant_id, entity_type, key)
      )
    `);
    await q.query(`CREATE INDEX idx_custom_fields_tenant_id ON "custom_fields" ("tenant_id")`);

    await q.query(`
      CREATE TABLE "custom_field_values" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"       uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "custom_field_id" uuid NOT NULL REFERENCES "custom_fields"("id") ON DELETE CASCADE,
        "entity_type"     varchar(20) NOT NULL,
        "entity_id"       uuid NOT NULL,
        "value"           jsonb NOT NULL,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_cfv_tenant_entity ON "custom_field_values" ("tenant_id", "entity_type", "entity_id")`);
    await q.query(`CREATE INDEX idx_cfv_tenant_field ON "custom_field_values" ("tenant_id", "custom_field_id")`);

    const tables = [
      'companies', 'pipelines', 'pipeline_stages', 'deals', 'tasks', 'notes',
      'tags', 'contact_tags', 'custom_fields', 'custom_field_values',
    ];
    for (const table of tables) {
      await q.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await q.query(
        `CREATE POLICY tenant_isolation_${table} ON "${table}"
         USING (tenant_id::text = current_setting('app.tenant_id', true))
         WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true))`,
      );
    }
  }

  async down(q: QueryRunner): Promise<void> {
    const tables = [
      'custom_field_values', 'custom_fields', 'contact_tags', 'tags', 'notes', 'tasks',
      'deals', 'pipeline_stages', 'pipelines', 'companies',
    ];
    for (const table of tables) {
      await q.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON "${table}"`);
      await q.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
    await q.query(`DROP TABLE IF EXISTS "custom_field_values"`);
    await q.query(`DROP TABLE IF EXISTS "custom_fields"`);
    await q.query(`DROP TABLE IF EXISTS "contact_tags"`);
    await q.query(`DROP TABLE IF EXISTS "tags"`);
    await q.query(`DROP TABLE IF EXISTS "notes"`);
    await q.query(`DROP TABLE IF EXISTS "tasks"`);
    await q.query(`DROP TABLE IF EXISTS "deals"`);
    await q.query(`DROP TABLE IF EXISTS "pipeline_stages"`);
    await q.query(`DROP TABLE IF EXISTS "pipelines"`);
    await q.query(`DROP INDEX IF EXISTS idx_contacts_tenant_owner`);
    await q.query(`DROP INDEX IF EXISTS idx_contacts_tenant_company`);
    await q.query(`DROP INDEX IF EXISTS idx_contacts_tenant_phone`);
    await q.query(`ALTER TABLE "contacts" DROP COLUMN IF EXISTS "phone"`);
    await q.query(`ALTER TABLE "contacts" DROP COLUMN IF EXISTS "lifecycle_stage"`);
    await q.query(`ALTER TABLE "contacts" DROP COLUMN IF EXISTS "lead_source"`);
    await q.query(`ALTER TABLE "contacts" DROP COLUMN IF EXISTS "owner_user_id"`);
    await q.query(`ALTER TABLE "contacts" DROP COLUMN IF EXISTS "company_id"`);
    await q.query(`DROP TABLE IF EXISTS "companies"`);
  }
}
