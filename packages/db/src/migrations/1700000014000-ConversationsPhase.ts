import { MigrationInterface, QueryRunner } from 'typeorm';

/** Phase 14 — Unified conversations inbox. */
export class ConversationsPhase1700000014000 implements MigrationInterface {
  name = 'ConversationsPhase1700000014000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE "conversations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "contact_id" uuid NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "assigned_user_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "last_message_at" timestamptz NOT NULL DEFAULT now(),
        "unread" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT conversations_tenant_contact_unique UNIQUE (tenant_id, contact_id)
      )
    `);
    await q.query(`CREATE INDEX idx_conversations_tenant_last_msg ON "conversations" ("tenant_id", "last_message_at" DESC)`);
    await q.query(`CREATE INDEX idx_conversations_tenant_assigned_unread ON "conversations" ("tenant_id", "assigned_user_id", "unread")`);

    await q.query(`
      CREATE TABLE "conversation_notes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
        "author_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "body" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await q.query(`CREATE INDEX idx_conversation_notes_tenant_conv ON "conversation_notes" ("tenant_id", "conversation_id", "created_at" DESC)`);

    await q.query(`ALTER TABLE "messages" ADD COLUMN "conversation_id" uuid NULL REFERENCES "conversations"("id") ON DELETE SET NULL`);
    await q.query(`ALTER TABLE "messages" ADD COLUMN "call_id" uuid NULL REFERENCES "calls"("id") ON DELETE SET NULL`);
    await q.query(`CREATE INDEX idx_messages_tenant_conversation ON "messages" ("tenant_id", "conversation_id", "created_at")`);

    for (const table of ['conversations', 'conversation_notes']) {
      await q.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await q.query(
        `CREATE POLICY tenant_isolation_${table} ON "${table}"
         USING (tenant_id::text = current_setting('app.tenant_id', true))
         WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true))`,
      );
    }

    // Backfill conversations from inbound email threads.
    await q.query(`
      INSERT INTO conversations (tenant_id, contact_id, last_message_at, unread, created_at, updated_at)
      SELECT DISTINCT ON (c.id)
        it.tenant_id, c.id, it.last_inbound_at, true, now(), now()
      FROM inbound_threads it
      JOIN contacts c ON c.tenant_id = it.tenant_id AND lower(c.email) = it.from_email AND c.deleted_at IS NULL
      ON CONFLICT (tenant_id, contact_id) DO NOTHING
    `);

    await q.query(`
      INSERT INTO messages (
        tenant_id, kind, from_email, to_email, subject, status, channel, direction, body,
        conversation_id, idempotency_key, created_at, updated_at
      )
      SELECT
        im.tenant_id, 'transactional', im.from_email, im.to_email, im.subject, 'delivered',
        'email', 'inbound', COALESCE(im.text, ''),
        conv.id, 'migrate-inbound-' || im.id::text, im.received_at, im.received_at
      FROM inbound_messages im
      JOIN inbound_threads it ON it.id = im.thread_id AND it.tenant_id = im.tenant_id
      JOIN contacts c ON c.tenant_id = im.tenant_id AND lower(c.email) = it.from_email AND c.deleted_at IS NULL
      JOIN conversations conv ON conv.tenant_id = im.tenant_id AND conv.contact_id = c.id
      WHERE NOT EXISTS (
        SELECT 1 FROM messages m WHERE m.idempotency_key = 'migrate-inbound-' || im.id::text
      )
    `);

    // Backfill conversations for contacts with SMS messages.
    await q.query(`
      INSERT INTO conversations (tenant_id, contact_id, last_message_at, unread, created_at, updated_at)
      SELECT m.tenant_id, c.id, MAX(m.created_at), true, now(), now()
      FROM messages m
      JOIN contacts c ON c.tenant_id = m.tenant_id
        AND c.phone IS NOT NULL
        AND (m.from_phone = c.phone OR m.to_phone = c.phone)
        AND c.deleted_at IS NULL
      WHERE m.channel IN ('sms', 'mms')
      GROUP BY m.tenant_id, c.id
      ON CONFLICT (tenant_id, contact_id) DO NOTHING
    `);

    await q.query(`
      UPDATE messages m
      SET conversation_id = conv.id
      FROM contacts c, conversations conv
      WHERE m.conversation_id IS NULL
        AND m.channel IN ('sms', 'mms')
        AND c.tenant_id = m.tenant_id
        AND c.phone IS NOT NULL
        AND (m.from_phone = c.phone OR m.to_phone = c.phone)
        AND conv.tenant_id = m.tenant_id
        AND conv.contact_id = c.id
    `);

    // Voice call events as inbox messages.
    await q.query(`
      INSERT INTO conversations (tenant_id, contact_id, last_message_at, unread, created_at, updated_at)
      SELECT DISTINCT ON (call.contact_id)
        call.tenant_id, call.contact_id, call.created_at, true, now(), now()
      FROM calls call
      WHERE call.contact_id IS NOT NULL
      ON CONFLICT (tenant_id, contact_id) DO NOTHING
    `);

    await q.query(`
      INSERT INTO messages (
        tenant_id, kind, from_email, to_email, subject, status, channel, direction, body,
        conversation_id, call_id, from_phone, to_phone, idempotency_key, created_at, updated_at
      )
      SELECT
        call.tenant_id, 'transactional',
        COALESCE(ct.email, 'voice@veyrasend.local'),
        'inbound@veyrasend.local',
        '(Call)',
        CASE WHEN call.status IN ('completed', 'in-progress') THEN 'delivered' ELSE 'failed' END,
        'voice', call.direction,
        call.direction || ' call — ' || call.status ||
          CASE WHEN call.duration_seconds IS NOT NULL THEN ' (' || call.duration_seconds || 's)' ELSE '' END,
        conv.id, call.id, call.from_number, call.to_number,
        'migrate-call-' || call.id::text, call.created_at, call.created_at
      FROM calls call
      LEFT JOIN contacts ct ON ct.id = call.contact_id
      JOIN conversations conv ON conv.tenant_id = call.tenant_id AND conv.contact_id = call.contact_id
      WHERE call.contact_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM messages m WHERE m.idempotency_key = 'migrate-call-' || call.id::text
        )
    `);

    await q.query(`
      UPDATE conversations conv
      SET last_message_at = sub.max_at
      FROM (
        SELECT conversation_id, MAX(created_at) AS max_at
        FROM messages
        WHERE conversation_id IS NOT NULL
        GROUP BY conversation_id
      ) sub
      WHERE conv.id = sub.conversation_id AND sub.max_at > conv.last_message_at
    `);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DELETE FROM messages WHERE idempotency_key LIKE 'migrate-call-%' OR idempotency_key LIKE 'migrate-inbound-%'`);
    await q.query(`DROP INDEX IF EXISTS idx_messages_tenant_conversation`);
    await q.query(`ALTER TABLE "messages" DROP COLUMN IF EXISTS "call_id"`);
    await q.query(`ALTER TABLE "messages" DROP COLUMN IF EXISTS "conversation_id"`);
    for (const table of ['conversation_notes', 'conversations']) {
      await q.query(`DROP POLICY IF EXISTS tenant_isolation_${table} ON "${table}"`);
      await q.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
      await q.query(`DROP TABLE IF EXISTS "${table}"`);
    }
  }
}
