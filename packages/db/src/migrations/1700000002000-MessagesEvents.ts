import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 3 schema: messages (transactional outbox/ledger) + email_events
 * (deduped event webhook log). Both tenant-scoped (RLS defense-in-depth).
 */
export class MessagesEvents1700000002000 implements MigrationInterface {
  name = 'MessagesEvents1700000002000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "messages" (
        "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"        uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "kind"             varchar(20) NOT NULL DEFAULT 'transactional',
        "campaign_id"      uuid NULL,
        "from_email"       varchar(255) NOT NULL,
        "to_email"         varchar(255) NOT NULL,
        "subject"          varchar(255) NOT NULL,
        "status"           varchar(40) NOT NULL DEFAULT 'queued',
        "sg_message_id"    varchar(255) NULL,
        "idempotency_key"  varchar(120) NOT NULL,
        "reason"           varchar(255) NULL,
        "created_at"       timestamptz NOT NULL DEFAULT now(),
        "updated_at"       timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT messages_tenant_idempotency_unique UNIQUE (tenant_id, idempotency_key)
      )
    `);
    await q.query(`CREATE INDEX idx_messages_tenant_id ON "messages" ("tenant_id")`);
    await q.query(`CREATE INDEX idx_messages_tenant_created ON "messages" ("tenant_id", "created_at")`);
    await q.query(`CREATE INDEX idx_messages_to_email ON "messages" ("to_email")`);

    await q.query(`
      CREATE TABLE "email_events" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"     uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "event_type"    varchar(40) NOT NULL,
        "sg_message_id" varchar(255) NULL,
        "sg_event_id"   varchar(160) NOT NULL UNIQUE,
        "recipient"     varchar(255) NULL,
        "sg_timestamp"  bigint NULL,
        "raw"           jsonb NOT NULL,
        "created_at"    timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_events_tenant_id ON "email_events" ("tenant_id")`);
    await q.query(`CREATE INDEX idx_events_tenant_created ON "email_events" ("tenant_id", "created_at")`);
    await q.query(`CREATE INDEX idx_events_sg_message_id ON "email_events" ("sg_message_id")`);

    for (const table of ['messages', 'email_events']) {
      await q.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await q.query(
        `CREATE POLICY tenant_isolation_${table} ON "${table}"
         USING (tenant_id::text = current_setting('app.tenant_id', true))
         WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true))`,
      );
    }
  }

  async down(q: QueryRunner): Promise<void> {
    for (const table of ['messages', 'email_events']) {
      await q.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON "${table}"`);
      await q.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
    await q.query(`DROP TABLE IF EXISTS "email_events"`);
    await q.query(`DROP TABLE IF EXISTS "messages"`);
  }
}
