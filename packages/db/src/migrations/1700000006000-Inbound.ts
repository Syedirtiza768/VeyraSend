import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 7 schema: inbound_threads + inbound_messages (Inbound Parse replies).
 * Tenant-scoped (RLS). A thread groups replies by (tenant, from_email, normalized subject).
 */
export class Inbound1700000006000 implements MigrationInterface {
  name = 'Inbound1700000006000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "inbound_threads" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"       uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "from_email"      varchar(255) NOT NULL,
        "to_email"        varchar(255) NOT NULL,
        "subject"         varchar(255) NOT NULL,
        "message_count"   int NOT NULL DEFAULT 1,
        "last_inbound_at" timestamptz NOT NULL DEFAULT now(),
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_inbound_threads_tenant_id ON "inbound_threads" ("tenant_id")`);
    await q.query(`CREATE INDEX idx_inbound_threads_tenant_from ON "inbound_threads" ("tenant_id", "from_email")`);

    await q.query(`
      CREATE TABLE "inbound_messages" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id"   uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "thread_id"   uuid NOT NULL REFERENCES "inbound_threads"("id") ON DELETE CASCADE,
        "from_email"  varchar(255) NOT NULL,
        "to_email"    varchar(255) NOT NULL,
        "subject"     varchar(255) NOT NULL,
        "text"        text NULL,
        "html"        text NULL,
        "attachments" jsonb NULL,
        "received_at" timestamptz NOT NULL DEFAULT now(),
        "created_at"  timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_inbound_messages_thread_id ON "inbound_messages" ("thread_id")`);
    await q.query(`CREATE INDEX idx_inbound_messages_tenant_id ON "inbound_messages" ("tenant_id")`);

    for (const table of ['inbound_threads', 'inbound_messages']) {
      await q.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await q.query(
        `CREATE POLICY tenant_isolation_${table} ON "${table}"
         USING (tenant_id::text = current_setting('app.tenant_id', true))
         WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true))`,
      );
    }
  }

  async down(q: QueryRunner): Promise<void> {
    for (const table of ['inbound_threads', 'inbound_messages']) {
      await q.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON "${table}"`);
      await q.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
    }
    await q.query(`DROP TABLE IF EXISTS "inbound_messages"`);
    await q.query(`DROP TABLE IF EXISTS "inbound_threads"`);
  }
}
