import { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 17 — Stripe billing: invoices, payment links, tenant Stripe settings. */
export class Phase17Billing1700000017000 implements MigrationInterface {
  name = 'Phase17Billing1700000017000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "tenant_stripe_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL UNIQUE REFERENCES "tenants"("id") ON DELETE CASCADE,
        "stripe_account_id" varchar(80) NULL,
        "encrypted_api_key" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await q.query(`
      CREATE TABLE "invoices" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "contact_id" uuid NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "status" varchar(20) NOT NULL DEFAULT 'draft',
        "line_items" jsonb NOT NULL DEFAULT '[]',
        "total_cents" bigint NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "stripe_payment_link_id" varchar(80) NULL,
        "payment_url" varchar(512) NULL,
        "due_date" date NULL,
        "paid_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_invoices_tenant_created ON "invoices" ("tenant_id", "created_at" DESC)`);
    await q.query(`CREATE INDEX idx_invoices_tenant_contact ON "invoices" ("tenant_id", "contact_id")`);

    await q.query(`
      CREATE TABLE "payment_links" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "contact_id" uuid NULL REFERENCES "contacts"("id") ON DELETE SET NULL,
        "amount_cents" bigint NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "description" varchar(255) NULL,
        "stripe_payment_link_id" varchar(80) NOT NULL,
        "payment_url" varchar(512) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_payment_links_tenant_created ON "payment_links" ("tenant_id", "created_at" DESC)`);

    const tables = ['tenant_stripe_settings', 'invoices', 'payment_links'];
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
    for (const t of ['payment_links', 'invoices', 'tenant_stripe_settings']) {
      await q.query(`DROP TABLE IF EXISTS "${t}" CASCADE`);
    }
  }
}
