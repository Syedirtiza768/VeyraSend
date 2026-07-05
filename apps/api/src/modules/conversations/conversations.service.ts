import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  Call,
  Contact,
  Conversation,
  ConversationNote,
  Message,
} from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { SmsService } from '../sms/sms.service';
import { MessagesService } from '../messages/messages.service';
import { PhoneNumbersService } from '../phone-numbers/phone-numbers.service';
import { SendersService } from '../senders/senders.service';

export interface ConversationRow {
  id: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  assignedUserId: string | null;
  lastMessageAt: string;
  unread: boolean;
  lastMessagePreview: string | null;
  channels: string[];
}

export interface ConversationMessageRow {
  id: string;
  channel: string;
  direction: string;
  body: string | null;
  subject: string;
  status: string;
  fromEmail: string;
  toEmail: string;
  fromPhone: string | null;
  toPhone: string | null;
  callId: string | null;
  createdAt: string;
}

export interface ConversationNoteRow {
  id: string;
  body: string;
  authorUserId: string;
  createdAt: string;
}

@Injectable()
export class ConversationsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @Inject(forwardRef(() => SmsService)) private readonly sms: SmsService,
    private readonly messages: MessagesService,
    private readonly phones: PhoneNumbersService,
    private readonly senders: SendersService,
  ) {}

  async ensureForContact(tenantId: string, contactId: string): Promise<Conversation> {
    const tid = assertTenant(tenantId);
    let conv = await this.ds.getRepository(Conversation).findOne({ where: { tenantId: tid, contactId } });
    if (conv) return conv;
    conv = this.ds.getRepository(Conversation).create({
      tenantId: tid,
      contactId,
      lastMessageAt: new Date(),
      unread: true,
    });
    return this.ds.getRepository(Conversation).save(conv);
  }

  async touchFromMessage(tenantId: string, conversationId: string, preview: string | null, inbound: boolean): Promise<void> {
    const tid = assertTenant(tenantId);
    const conv = await this.ds.getRepository(Conversation).findOne({ where: { id: conversationId, tenantId: tid } });
    if (!conv) return;
    conv.lastMessageAt = new Date();
    if (inbound) conv.unread = true;
    await this.ds.getRepository(Conversation).save(conv);
  }

  async linkMessage(tenantId: string, contactId: string, messageId: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const conv = await this.ensureForContact(tid, contactId);
    await this.ds.getRepository(Message).update({ id: messageId, tenantId: tid }, { conversationId: conv.id });
    const msg = await this.ds.getRepository(Message).findOne({ where: { id: messageId, tenantId: tid } });
    if (msg) {
      await this.touchFromMessage(tid, conv.id, msg.body ?? msg.subject, msg.direction === 'inbound');
    }
  }

  async recordVoiceCall(tenantId: string, call: Call): Promise<void> {
    if (!call.contactId) return;
    const tid = assertTenant(tenantId);
    const conv = await this.ensureForContact(tid, call.contactId);
    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: call.contactId, tenantId: tid } });
    const idempotencyKey = `voice-call-${call.id}`;
    const existing = await this.ds.getRepository(Message).findOne({ where: { tenantId: tid, idempotencyKey } });
    const body =
      `${call.direction} call — ${call.status}` +
      (call.durationSeconds != null ? ` (${call.durationSeconds}s)` : '');
    if (existing) {
      existing.status = ['completed', 'in-progress'].includes(call.status) ? 'delivered' : 'failed';
      existing.body = body;
      await this.ds.getRepository(Message).save(existing);
    } else {
      const msg = this.ds.getRepository(Message).create({
        tenantId: tid,
        kind: 'transactional',
        channel: 'voice',
        direction: call.direction,
        fromEmail: contact?.email ?? 'voice@veyrasend.local',
        toEmail: 'inbound@veyrasend.local',
        fromPhone: call.fromNumber,
        toPhone: call.toNumber,
        subject: '(Call)',
        body,
        status: ['completed', 'in-progress'].includes(call.status) ? 'delivered' : 'failed',
        conversationId: conv.id,
        callId: call.id,
        idempotencyKey,
      });
      await this.ds.getRepository(Message).save(msg);
    }
    await this.touchFromMessage(tid, conv.id, body, call.direction === 'inbound');
  }

  async list(
    tenantId: string,
    filters: { channel?: string; assignedUserId?: string; unread?: string; limit?: number },
  ): Promise<ConversationRow[]> {
    const tid = assertTenant(tenantId);
    const limit = Math.min(filters.limit ?? 50, 100);
    const qb = this.ds
      .getRepository(Conversation)
      .createQueryBuilder('c')
      .innerJoin(Contact, 'ct', 'ct.id = c.contact_id AND ct.tenant_id = c.tenant_id')
      .where('c.tenant_id = :tid', { tid })
      .orderBy('c.last_message_at', 'DESC')
      .take(limit);

    if (filters.assignedUserId) {
      qb.andWhere('c.assigned_user_id = :assignedUserId', { assignedUserId: filters.assignedUserId });
    }
    if (filters.unread === 'true') qb.andWhere('c.unread = true');
    if (filters.unread === 'false') qb.andWhere('c.unread = false');
    if (filters.channel) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id AND m.tenant_id = :tid AND m.channel = :channel)`,
        { channel: filters.channel },
      );
    }

    const rows = await qb
      .select([
        'c.id AS id',
        'c.contact_id AS "contactId"',
        'c.assigned_user_id AS "assignedUserId"',
        'c.last_message_at AS "lastMessageAt"',
        'c.unread AS unread',
        'ct.first_name AS "firstName"',
        'ct.last_name AS "lastName"',
        'ct.email AS "contactEmail"',
        'ct.phone AS "contactPhone"',
      ])
      .getRawMany<{
        id: string;
        contactId: string;
        assignedUserId: string | null;
        lastMessageAt: Date;
        unread: boolean;
        firstName: string | null;
        lastName: string | null;
        contactEmail: string;
        contactPhone: string | null;
      }>();

    const result: ConversationRow[] = [];
    for (const r of rows) {
      const lastMsg = await this.ds.getRepository(Message).findOne({
        where: { tenantId: tid, conversationId: r.id },
        order: { createdAt: 'DESC' },
      });
      const channelRows = await this.ds.query(
        `SELECT DISTINCT channel FROM messages WHERE tenant_id = $1 AND conversation_id = $2`,
        [tid, r.id],
      );
      const name = [r.firstName, r.lastName].filter(Boolean).join(' ') || r.contactEmail;
      result.push({
        id: r.id,
        contactId: r.contactId,
        contactName: name,
        contactEmail: r.contactEmail,
        contactPhone: r.contactPhone,
        assignedUserId: r.assignedUserId,
        lastMessageAt: r.lastMessageAt.toISOString(),
        unread: r.unread,
        lastMessagePreview: lastMsg?.body ?? lastMsg?.subject ?? null,
        channels: channelRows.map((c: { channel: string }) => c.channel),
      });
    }
    return result;
  }

  async getById(tenantId: string, id: string, messageLimit = 20) {
    const tid = assertTenant(tenantId);
    const conv = await this.ds.getRepository(Conversation).findOne({ where: { id, tenantId: tid } });
    if (!conv) throw new NotFoundException('Conversation not found in this tenant.');
    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: conv.contactId, tenantId: tid } });
    const messages = await this.getMessages(tid, id, messageLimit);
    const notes = await this.listNotes(tid, id);
    return {
      id: conv.id,
      contactId: conv.contactId,
      contact,
      assignedUserId: conv.assignedUserId,
      lastMessageAt: conv.lastMessageAt.toISOString(),
      unread: conv.unread,
      messages,
      notes,
    };
  }

  async getMessages(tenantId: string, conversationId: string, limit = 50): Promise<ConversationMessageRow[]> {
    const tid = assertTenant(tenantId);
    await this.assertConversation(tid, conversationId);
    const rows = await this.ds.getRepository(Message).find({
      where: { tenantId: tid, conversationId },
      order: { createdAt: 'ASC' },
      take: limit,
    });
    return rows.map((m) => ({
      id: m.id,
      channel: m.channel,
      direction: m.direction,
      body: m.body,
      subject: m.subject,
      status: m.status,
      fromEmail: m.fromEmail,
      toEmail: m.toEmail,
      fromPhone: m.fromPhone,
      toPhone: m.toPhone,
      callId: m.callId,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async sendReply(
    tenantId: string,
    conversationId: string,
    actorUserId: string | null,
    input: { body: string; channel?: string },
  ): Promise<{ messageId: string }> {
    const tid = assertTenant(tenantId);
    const conv = await this.assertConversation(tid, conversationId);
    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: conv.contactId, tenantId: tid } });
    if (!contact) throw new NotFoundException('Contact not found.');

    const lastMsg = await this.ds.getRepository(Message).findOne({
      where: { tenantId: tid, conversationId },
      order: { createdAt: 'DESC' },
    });
    const channel = input.channel ?? lastMsg?.channel ?? 'email';

    if (channel === 'sms' || channel === 'mms') {
      if (!contact.phone) throw new BadRequestException('Contact has no phone number.');
      const numbers = await this.phones.list(tid);
      const active = numbers.find((n) => n.status === 'active');
      if (!active) throw new UnprocessableEntityException('channel_not_configured');
      const result = await this.sms.send(tid, { contactId: contact.id, fromNumberId: active.id, body: input.body });
      await this.linkMessage(tid, contact.id, result.messageId);
      conv.unread = false;
      await this.ds.getRepository(Conversation).save(conv);
      return result;
    }

    if (channel === 'email') {
      const senderList = await this.senders.list(tid);
      const sender = senderList.find((s) => s.verified) ?? senderList[0];
      if (!sender) throw new UnprocessableEntityException('channel_not_configured');
      const row = await this.messages.send(tid, actorUserId, {
        fromEmail: sender.fromEmail,
        fromName: sender.fromName ?? undefined,
        toEmail: contact.email,
        subject: `Re: conversation`,
        text: input.body,
      });
      await this.ds.getRepository(Message).update(
        { id: row.id, tenantId: tid },
        { conversationId: conv.id, channel: 'email', direction: 'outbound', body: input.body },
      );
      conv.unread = false;
      await this.ds.getRepository(Conversation).save(conv);
      return { messageId: row.id };
    }

    throw new BadRequestException(`Unsupported channel: ${channel}`);
  }

  async assign(tenantId: string, id: string, userId: string | null): Promise<Conversation> {
    const tid = assertTenant(tenantId);
    const conv = await this.assertConversation(tid, id);
    conv.assignedUserId = userId;
    return this.ds.getRepository(Conversation).save(conv);
  }

  async markRead(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const conv = await this.assertConversation(tid, id);
    conv.unread = false;
    await this.ds.getRepository(Conversation).save(conv);
  }

  async addNote(tenantId: string, conversationId: string, authorUserId: string, body: string): Promise<ConversationNoteRow> {
    const tid = assertTenant(tenantId);
    await this.assertConversation(tid, conversationId);
    const note = this.ds.getRepository(ConversationNote).create({
      tenantId: tid,
      conversationId,
      authorUserId,
      body,
    });
    const saved = await this.ds.getRepository(ConversationNote).save(note);
    return { id: saved.id, body: saved.body, authorUserId: saved.authorUserId, createdAt: saved.createdAt.toISOString() };
  }

  private async listNotes(tenantId: string, conversationId: string): Promise<ConversationNoteRow[]> {
    const rows = await this.ds.getRepository(ConversationNote).find({
      where: { tenantId, conversationId },
      order: { createdAt: 'ASC' },
    });
    return rows.map((n) => ({
      id: n.id,
      body: n.body,
      authorUserId: n.authorUserId,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  private async assertConversation(tenantId: string, id: string): Promise<Conversation> {
    const conv = await this.ds.getRepository(Conversation).findOne({ where: { id, tenantId } });
    if (!conv) throw new NotFoundException('Conversation not found in this tenant.');
    return conv;
  }
}
