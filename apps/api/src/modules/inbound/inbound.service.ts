import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InboundThread, InboundMessage, Contact, Message, type InboundAttachment } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { ConversationsService } from '../conversations/conversations.service';
import { v4 as uuidv4 } from 'uuid';

export interface InboundParseInput {
  from: string;
  to: string;
  subject: string;
  text?: string | null;
  html?: string | null;
  attachments?: InboundAttachment[];
}

export interface ThreadRow {
  id: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  messageCount: number;
  lastInboundAt: string;
  createdAt: string;
}

export interface InboundMessageRow {
  id: string;
  threadId: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  text: string | null;
  html: string | null;
  attachments: InboundAttachment[] | null;
  receivedAt: string;
}

/** Strip Re:/Fwd:/Aw: prefixes for thread grouping. */
export function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(\s*(re|fwd|aw|wg)\s*:\s*)+/i, '')
    .trim()
    .toLowerCase();
}

/**
 * Phase 7 — Inbound Parse. SendGrid posts incoming replies here. The reply is
 * attributed to a tenant via the sender's contact record (we only emailed
 * known contacts), then grouped into a thread by (tenant, from, normalized subject).
 */
@Injectable()
export class InboundService {
  private readonly logger = new Logger('InboundService');

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly conversations: ConversationsService,
  ) {}

  async ingest(input: InboundParseInput): Promise<{ threadId: string; attributed: boolean }> {
    const fromEmail = (input.from || '').toLowerCase().trim();
    const subject = input.subject || '(no subject)';
    if (!fromEmail) throw new Error('Inbound parse missing "from".');

    // Attribute tenant via the contact ledger.
    const contact = await this.ds.getRepository(Contact).findOne({ where: { email: fromEmail } });
    if (!contact) {
      this.logger.log(`inbound from unknown contact ${fromEmail} — skipped`);
      return { threadId: '', attributed: false };
    }
    const tenantId = contact.tenantId;
    const norm = normalizeSubject(subject);
    const receivedAt = new Date();

    let thread = await this.ds
      .getRepository(InboundThread)
      .findOne({ where: { tenantId, fromEmail, subject: norm } });
    if (!thread) {
      thread = this.ds.getRepository(InboundThread).create({
        tenantId,
        fromEmail,
        toEmail: (input.to || '').toLowerCase().trim(),
        subject: norm,
        messageCount: 0,
        lastInboundAt: receivedAt,
      });
      await this.ds.getRepository(InboundThread).save(thread);
    }

    const msg = this.ds.getRepository(InboundMessage).create({
      tenantId,
      threadId: thread.id,
      fromEmail,
      toEmail: (input.to || '').toLowerCase().trim(),
      subject,
      text: input.text ?? null,
      html: input.html ?? null,
      attachments: input.attachments ?? null,
      receivedAt,
    });
    await this.ds.getRepository(InboundMessage).save(msg);

    const conv = await this.conversations.ensureForContact(tenantId, contact.id);
    const unified = this.ds.getRepository(Message).create({
      tenantId,
      kind: 'transactional',
      channel: 'email',
      direction: 'inbound',
      fromEmail,
      toEmail: (input.to || '').toLowerCase().trim(),
      subject,
      body: input.text ?? null,
      status: 'delivered',
      conversationId: conv.id,
      idempotencyKey: `inbound-email-${msg.id}`,
    });
    await this.ds.getRepository(Message).save(unified);
    await this.conversations.touchFromMessage(tenantId, conv.id, input.text ?? subject, true);

    thread.messageCount = thread.messageCount + 1;
    thread.lastInboundAt = receivedAt;
    await this.ds.getRepository(InboundThread).save(thread);

    return { threadId: thread.id, attributed: true };
  }

  async listThreads(tenantId: string): Promise<ThreadRow[]> {
    const rows = await this.ds.getRepository(InboundThread).find({
      where: { tenantId },
      order: { lastInboundAt: 'DESC' },
    });
    return rows.map((t) => ({
      id: t.id,
      fromEmail: t.fromEmail,
      toEmail: t.toEmail,
      subject: t.subject,
      messageCount: t.messageCount,
      lastInboundAt: t.lastInboundAt.toISOString(),
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async threadMessages(tenantId: string, threadId: string): Promise<InboundMessageRow[]> {
    const rows = await this.ds.getRepository(InboundMessage).find({
      where: { tenantId, threadId },
      order: { receivedAt: 'ASC' },
    });
    return rows.map((m) => ({
      id: m.id,
      threadId: m.threadId,
      fromEmail: m.fromEmail,
      toEmail: m.toEmail,
      subject: m.subject,
      text: m.text,
      html: m.html,
      attachments: m.attachments,
      receivedAt: m.receivedAt.toISOString(),
    }));
  }
}
