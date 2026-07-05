import { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 16 — Calendar, forms, funnels, reputation. */
export class Phase16CalendarFormsReputation1700000016000 implements MigrationInterface {
  name = 'Phase16CalendarFormsReputation1700000016000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "calendars" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name" varchar(120) NOT NULL,
        "owner_user_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "timezone" varchar(60) NOT NULL DEFAULT 'America/New_York',
        "availability" jsonb NOT NULL DEFAULT '{}',
        "booking_slug" varchar(80) NOT NULL UNIQUE,
        "member_user_ids" uuid[] NULL,
        "slot_duration_minutes" int NOT NULL DEFAULT 30,
        "buffer_minutes" int NOT NULL DEFAULT 15,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_calendars_tenant ON "calendars" ("tenant_id")`);

    await q.query(`
      CREATE TABLE "appointments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "calendar_id" uuid NOT NULL REFERENCES "calendars"("id") ON DELETE CASCADE,
        "contact_id" uuid NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "assigned_user_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "appointment_type" varchar(80) NULL,
        "starts_at" timestamptz NOT NULL,
        "ends_at" timestamptz NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'booked',
        "location" varchar(255) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_appointments_tenant_calendar_starts ON "appointments" ("tenant_id", "calendar_id", "starts_at")`);
    await q.query(`CREATE INDEX idx_appointments_tenant_contact ON "appointments" ("tenant_id", "contact_id")`);

    await q.query(`
      CREATE TABLE "forms" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name" varchar(120) NOT NULL,
        "spam_protection" varchar(20) NOT NULL DEFAULT 'honeypot',
        "redirect_url" varchar(500) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await q.query(`CREATE INDEX idx_forms_tenant_created ON "forms" ("tenant_id", "created_at" DESC)`);

    await q.query(`
      CREATE TABLE "form_fields" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "form_id" uuid NOT NULL REFERENCES "forms"("id") ON DELETE CASCADE,
        "label" varchar(120) NOT NULL,
        "field_key" varchar(80) NOT NULL,
        "field_type" varchar(20) NOT NULL,
        "required" boolean NOT NULL DEFAULT false,
        "position" int NOT NULL,
        "options" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_form_fields_tenant_form_pos ON "form_fields" ("tenant_id", "form_id", "position")`);

    await q.query(`
      CREATE TABLE "form_submissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "form_id" uuid NOT NULL REFERENCES "forms"("id") ON DELETE CASCADE,
        "contact_id" uuid NULL REFERENCES "contacts"("id") ON DELETE SET NULL,
        "data" jsonb NOT NULL DEFAULT '{}',
        "utm" jsonb NULL,
        "ip_address" varchar(45) NULL,
        "is_spam" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_form_submissions_tenant_form ON "form_submissions" ("tenant_id", "form_id", "created_at" DESC)`);

    await q.query(`
      CREATE TABLE "landing_pages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name" varchar(120) NOT NULL,
        "slug" varchar(80) NOT NULL UNIQUE,
        "content" jsonb NOT NULL DEFAULT '[]',
        "published" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_landing_pages_tenant ON "landing_pages" ("tenant_id")`);

    await q.query(`
      CREATE TABLE "funnels" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name" varchar(120) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await q.query(`
      CREATE TABLE "funnel_steps" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "funnel_id" uuid NOT NULL REFERENCES "funnels"("id") ON DELETE CASCADE,
        "landing_page_id" uuid NOT NULL REFERENCES "landing_pages"("id") ON DELETE CASCADE,
        "position" int NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_funnel_steps_tenant_funnel ON "funnel_steps" ("tenant_id", "funnel_id", "position")`);

    await q.query(`
      CREATE TABLE "reputation_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL UNIQUE REFERENCES "tenants"("id") ON DELETE CASCADE,
        "google_review_link" varchar(500) NULL,
        "widget_testimonials" jsonb NOT NULL DEFAULT '[]',
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await q.query(`
      CREATE TABLE "review_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "contact_id" uuid NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "channel" varchar(10) NOT NULL,
        "review_link" varchar(500) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'sent',
        "sent_at" timestamptz NOT NULL DEFAULT now(),
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_review_requests_tenant_contact ON "review_requests" ("tenant_id", "contact_id")`);

    const tables = [
      'calendars', 'appointments', 'forms', 'form_fields', 'form_submissions',
      'landing_pages', 'funnels', 'funnel_steps', 'reputation_settings', 'review_requests',
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
      'review_requests', 'reputation_settings', 'funnel_steps', 'funnels', 'landing_pages',
      'form_submissions', 'form_fields', 'forms', 'appointments', 'calendars',
    ];
    for (const t of tables) await q.query(`DROP TABLE IF EXISTS "${t}" CASCADE`);
  }
}
