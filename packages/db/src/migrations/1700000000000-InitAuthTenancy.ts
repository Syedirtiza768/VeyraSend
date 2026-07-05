import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 1 schema: tenants, users, roles, tenant_memberships, audit_logs.
 * Tenant-scoped tables carry tenant_id + indexes + RLS policies (ADR-0002).
 * RLS is enabled (not forced) as defense-in-depth; primary enforcement is the
 * application-level mandatory tenant filter. A future least-privilege app
 * role will get full RLS protection.
 */
export class InitAuthTenancy1700000000000 implements MigrationInterface {
  name = 'InitAuthTenancy1700000000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await q.query(`
      CREATE TABLE "tenants" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name"       varchar(120) NOT NULL,
        "slug"       varchar(80)  NOT NULL UNIQUE,
        "created_at" timestamptz  NOT NULL DEFAULT now(),
        "updated_at" timestamptz  NOT NULL DEFAULT now(),
        "deleted_at" timestamptz  NULL
      )
    `);

    await q.query(`
      CREATE TABLE "users" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"         varchar(255) NOT NULL UNIQUE,
        "password_hash" varchar(255) NOT NULL,
        "name"          varchar(120) NULL,
        "created_at"    timestamptz  NOT NULL DEFAULT now(),
        "updated_at"    timestamptz  NOT NULL DEFAULT now()
      )
    `);

    await q.query(`
      CREATE TABLE "roles" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"  uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name"       varchar(60) NOT NULL,
        "is_system"  boolean NOT NULL DEFAULT false,
        "permissions" text[] NOT NULL DEFAULT '{}',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT roles_tenant_name_unique UNIQUE (tenant_id, name)
      )
    `);
    await q.query(`CREATE INDEX idx_roles_tenant_id ON "roles" ("tenant_id")`);

    await q.query(`
      CREATE TABLE "tenant_memberships" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"  uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "user_id"    uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "role_id"    uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT memberships_tenant_user_unique UNIQUE (tenant_id, user_id)
      )
    `);
    await q.query(`CREATE INDEX idx_memberships_tenant_id ON "tenant_memberships" ("tenant_id")`);
    await q.query(`CREATE INDEX idx_memberships_user_id ON "tenant_memberships" ("user_id")`);

    await q.query(`
      CREATE TABLE "audit_logs" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"     uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "actor_user_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "action"        varchar(80) NOT NULL,
        "entity_type"   varchar(80) NULL,
        "entity_id"     uuid NULL,
        "detail"        jsonb NULL,
        "created_at"    timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_audit_tenant_created ON "audit_logs" ("tenant_id", "created_at")`);

    // Row-level security (defense-in-depth). Enabled, not forced, so the
    // table owner (migrations/runtime connection) is unaffected; a future
    // least-privilege app role will be constrained by these policies.
    for (const table of ['roles', 'tenant_memberships', 'audit_logs']) {
      await q.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await q.query(
        `CREATE POLICY tenant_isolation_${table} ON "${table}"
         USING (tenant_id::text = current_setting('app.tenant_id', true))
         WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true))`,
      );
    }
  }

  async down(q: QueryRunner): Promise<void> {
    for (const table of ['roles', 'tenant_memberships', 'audit_logs']) {
      await q.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON "${table}"`);
      await q.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
    await q.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await q.query(`DROP TABLE IF EXISTS "tenant_memberships"`);
    await q.query(`DROP TABLE IF EXISTS "roles"`);
    await q.query(`DROP TABLE IF EXISTS "users"`);
    await q.query(`DROP TABLE IF EXISTS "tenants"`);
  }
}
