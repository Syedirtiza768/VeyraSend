import { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 13 — Twilio tables, SMS message columns, contact sms opt-in, usage_records, RBAC backfill prep. */
export class TwilioPhase1700000013000 implements MigrationInterface {
  name = 'TwilioPhase1700000013000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "tenant_twilio_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL UNIQUE REFERENCES "tenants"("id") ON DELETE CASCADE,
        "twilio_subaccount_sid" varchar(40) NOT NULL,
        "encrypted_auth_token" text NOT NULL,
        "messaging_service_sid" varchar(40) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await q.query(`
      CREATE TABLE "phone_numbers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "twilio_sid" varchar(40) NOT NULL,
        "e164_number" varchar(20) NOT NULL UNIQUE,
        "capabilities" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "assigned_user_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "forward_to" varchar(40) NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_phone_numbers_tenant_id ON "phone_numbers" ("tenant_id")`);

    await q.query(`
      CREATE TABLE "calls" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "contact_id" uuid NULL REFERENCES "contacts"("id") ON DELETE SET NULL,
        "phone_number_id" uuid NOT NULL REFERENCES "phone_numbers"("id") ON DELETE RESTRICT,
        "direction" varchar(20) NOT NULL,
        "from_number" varchar(40) NOT NULL,
        "to_number" varchar(40) NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'queued',
        "duration_seconds" int NULL,
        "disposition" varchar(40) NULL,
        "twilio_call_sid" varchar(40) NULL,
        "started_at" timestamptz NULL,
        "ended_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_calls_tenant_contact ON "calls" ("tenant_id", "contact_id")`);
    await q.query(`CREATE UNIQUE INDEX idx_calls_twilio_sid ON "calls" ("twilio_call_sid") WHERE "twilio_call_sid" IS NOT NULL`);

    await q.query(`
      CREATE TABLE "call_recordings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "call_id" uuid NOT NULL REFERENCES "calls"("id") ON DELETE CASCADE,
        "twilio_recording_sid" varchar(40) NOT NULL,
        "url" varchar(512) NOT NULL,
        "duration_seconds" int NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_call_recordings_tenant_call ON "call_recordings" ("tenant_id", "call_id")`);

    await q.query(`
      CREATE TABLE "voicemail_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "call_id" uuid NOT NULL REFERENCES "calls"("id") ON DELETE CASCADE,
        "recording_url" varchar(512) NOT NULL,
        "transcription" text NULL,
        "duration_seconds" int NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_voicemail_tenant_call ON "voicemail_messages" ("tenant_id", "call_id")`);

    await q.query(`
      CREATE TABLE "twilio_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "event_type" varchar(60) NOT NULL,
        "resource_sid" varchar(40) NOT NULL,
        "twilio_event_id" varchar(80) NULL,
        "raw" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_twilio_events_tenant_resource ON "twilio_events" ("tenant_id", "resource_sid")`);

    await q.query(`
      CREATE TABLE "usage_records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "period_start" date NOT NULL,
        "period_end" date NOT NULL,
        "provider" varchar(20) NOT NULL,
        "metric" varchar(40) NOT NULL,
        "quantity" bigint NOT NULL DEFAULT 0,
        "cost_micros" bigint NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT usage_records_unique UNIQUE (tenant_id, period_start, provider, metric)
      )
    `);
    await q.query(`CREATE INDEX idx_usage_records_tenant ON "usage_records" ("tenant_id")`);

    await q.query(`ALTER TABLE "contacts" ADD COLUMN "sms_opt_in_status" varchar(20) NOT NULL DEFAULT 'unknown'`);

    await q.query(`ALTER TABLE "messages" ADD COLUMN "channel" varchar(20) NOT NULL DEFAULT 'email'`);
    await q.query(`ALTER TABLE "messages" ADD COLUMN "direction" varchar(20) NOT NULL DEFAULT 'outbound'`);
    await q.query(`ALTER TABLE "messages" ADD COLUMN "provider_message_id" varchar(255) NULL`);
    await q.query(`ALTER TABLE "messages" ADD COLUMN "from_phone" varchar(40) NULL`);
    await q.query(`ALTER TABLE "messages" ADD COLUMN "to_phone" varchar(40) NULL`);
    await q.query(`ALTER TABLE "messages" ADD COLUMN "body" text NULL`);
    await q.query(`CREATE INDEX idx_messages_tenant_provider_sid ON "messages" ("tenant_id", "provider_message_id")`);

    const tables = [
      'tenant_twilio_settings', 'phone_numbers', 'calls', 'call_recordings',
      'voicemail_messages', 'twilio_events', 'usage_records',
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
      'usage_records', 'twilio_events', 'voicemail_messages', 'call_recordings',
      'calls', 'phone_numbers', 'tenant_twilio_settings',
    ];
    for (const table of tables) {
      await q.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON "${table}"`);
      await q.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
    await q.query(`DROP INDEX IF EXISTS idx_messages_tenant_provider_sid`);
    await q.query(`ALTER TABLE "messages" DROP COLUMN IF EXISTS "body"`);
    await q.query(`ALTER TABLE "messages" DROP COLUMN IF EXISTS "to_phone"`);
    await q.query(`ALTER TABLE "messages" DROP COLUMN IF EXISTS "from_phone"`);
    await q.query(`ALTER TABLE "messages" DROP COLUMN IF EXISTS "provider_message_id"`);
    await q.query(`ALTER TABLE "messages" DROP COLUMN IF EXISTS "direction"`);
    await q.query(`ALTER TABLE "messages" DROP COLUMN IF EXISTS "channel"`);
    await q.query(`ALTER TABLE "contacts" DROP COLUMN IF EXISTS "sms_opt_in_status"`);
    for (const table of tables) {
      await q.query(`DROP TABLE IF EXISTS "${table}"`);
    }
  }
}
