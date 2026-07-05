import { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 18 — Agency layer: tenant hierarchy, billing plans, feature flags. */
export class Phase18Agency1700000018000 implements MigrationInterface {
  name = 'Phase18Agency1700000018000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "tenants" ADD COLUMN "parent_tenant_id" uuid NULL REFERENCES "tenants"("id") ON DELETE SET NULL`);
    await q.query(`ALTER TABLE "tenants" ADD COLUMN "type" varchar(20) NOT NULL DEFAULT 'direct'`);
    await q.query(`ALTER TABLE "tenants" ADD COLUMN "white_label_config" jsonb NULL`);

    await q.query(`
      CREATE TABLE "billing_plans" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "price_cents" bigint NOT NULL,
        "interval" varchar(10) NOT NULL DEFAULT 'month',
        "included_usage" jsonb NOT NULL DEFAULT '{}',
        "feature_flags" text[] NOT NULL DEFAULT '{}',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await q.query(`
      CREATE TABLE "feature_flags" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "key" varchar(80) NOT NULL,
        "enabled" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE UNIQUE INDEX idx_feature_flags_tenant_key ON "feature_flags" ("tenant_id", "key") WHERE "tenant_id" IS NOT NULL`);
    await q.query(`CREATE UNIQUE INDEX idx_feature_flags_global_key ON "feature_flags" ("key") WHERE "tenant_id" IS NULL`);

    await q.query(`ALTER TABLE "usage_records" ADD COLUMN IF NOT EXISTS "billed_micros" bigint NULL`);

    await q.query(`ALTER TABLE "tenants" ADD COLUMN "billing_plan_id" uuid NULL`);
    await q.query(`CREATE INDEX idx_tenants_parent ON "tenants" ("parent_tenant_id")`);
    await q.query(`ALTER TABLE "tenants" ADD CONSTRAINT fk_tenants_billing_plan FOREIGN KEY ("billing_plan_id") REFERENCES "billing_plans"("id") ON DELETE SET NULL`);

    await q.query(`
      INSERT INTO "billing_plans" ("name", "price_cents", "interval", "included_usage", "feature_flags")
      VALUES
        ('Starter', 4900, 'month', '{"emails_sent":5000,"sms_sent":500}', ARRAY['workflows','forms']),
        ('Growth', 14900, 'month', '{"emails_sent":25000,"sms_sent":2500}', ARRAY['workflows','forms','funnels','calendar']),
        ('Agency', 49900, 'month', '{"emails_sent":100000,"sms_sent":10000}', ARRAY['workflows','forms','funnels','calendar','billing','agency'])
    `);

    await q.query(`
      INSERT INTO "feature_flags" ("tenant_id", "key", "enabled") VALUES
        (NULL, 'workflows', true),
        (NULL, 'forms', true),
        (NULL, 'funnels', true),
        (NULL, 'calendar', true),
        (NULL, 'billing', false),
        (NULL, 'agency', false)
    `);

    await q.query(`ALTER TABLE "feature_flags" ENABLE ROW LEVEL SECURITY`);
    await q.query(
      `CREATE POLICY tenant_isolation_feature_flags ON "feature_flags"
       USING (tenant_id IS NULL OR tenant_id::text = current_setting('app.tenant_id', true))
       WITH CHECK (tenant_id IS NULL OR tenant_id::text = current_setting('app.tenant_id', true))`,
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "tenants" DROP CONSTRAINT IF EXISTS fk_tenants_billing_plan`);
    await q.query(`ALTER TABLE "usage_records" DROP COLUMN IF EXISTS "billed_micros"`);
    await q.query(`DROP TABLE IF EXISTS "feature_flags" CASCADE`);
    await q.query(`DROP TABLE IF EXISTS "billing_plans" CASCADE`);
    await q.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "billing_plan_id"`);
    await q.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "white_label_config"`);
    await q.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "type"`);
    await q.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "parent_tenant_id"`);
  }
}
