import { BadRequestException, Injectable, UnprocessableEntityException, Inject, forwardRef } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Contact, Message, UsageRecord } from '@veyrasend/db';
import { TwilioClient } from '@veyrasend/twilio';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { TwilioIntegrationService } from '../twilio/twilio-integration.service';
import { PhoneNumbersService } from '../phone-numbers/phone-numbers.service';
import { ConversationsService } from '../conversations/conversations.service';
import { WorkflowDispatchService } from '../workflows/workflow-dispatch.service';
import { v4 as uuidv4 } from 'uuid';

const STOP_WORDS = new Set(['stop', 'unsubscribe', 'cancel', 'end', 'quit']);
const START_WORDS = new Set(['start', 'unstop']);

@Injectable()
export class SmsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly twilio: TwilioIntegrationService,
    private readonly phones: PhoneNumbersService,
    private readonly client: TwilioClient,
    @Inject(forwardRef(() => ConversationsService)) private readonly conversations: ConversationsService,
    @Inject(forwardRef(() => WorkflowDispatchService)) private readonly workflows: WorkflowDispatchService,
  ) {}

  normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (phone.startsWith('+')) return phone;
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return `+${digits}`;
  }

  async findOrCreateContactByPhone(tenantId: string, phone: string): Promise<Contact> {
    const tid = assertTenant(tenantId);
    const normalized = this.normalizePhone(phone);
    let contact = await this.ds.getRepository(Contact).findOne({ where: { tenantId: tid, phone: normalized } });
    if (contact) return contact;
    contact = this.ds.getRepository(Contact).create({
      tenantId: tid,
      email: `sms+${normalized.replace(/\D/g, '')}@phone.local`,
      phone: normalized,
      smsOptInStatus: 'unknown',
      status: 'active',
    });
    return this.ds.getRepository(Contact).save(contact);
  }

  assertCanSend(contact: Contact): void {
    if (contact.smsOptInStatus === 'opted_out') {
      throw new UnprocessableEntityException('sms_opt_out_blocked');
    }
    if (contact.smsOptInStatus === 'unknown') {
      throw new UnprocessableEntityException('sms_opt_in_required');
    }
  }

  async send(tenantId: string, args: { contactId: string; fromNumberId: string; body: string }): Promise<{ messageId: string }> {
    const tid = assertTenant(tenantId);
    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: args.contactId, tenantId: tid } });
    if (!contact?.phone) throw new BadRequestException('Contact has no phone number.');
    this.assertCanSend(contact);
    const fromPhone = await this.phones.getById(tid, args.fromNumberId);
    const auth = await this.twilio.getDecryptedAuth(tid);
    const idempotencyKey = `sms-${uuidv4()}`;
    const msg = this.ds.getRepository(Message).create({
      tenantId: tid,
      kind: 'transactional',
      channel: 'sms',
      direction: 'outbound',
      fromEmail: 'sms@veyrasend.local',
      toEmail: contact.email,
      fromPhone: fromPhone.e164Number,
      toPhone: contact.phone,
      subject: '(SMS)',
      body: args.body,
      status: 'queued',
      idempotencyKey,
    });
    await this.ds.getRepository(Message).save(msg);
    await this.conversations.linkMessage(tid, contact.id, msg.id);
    const result = await this.client.sendSms({
      subaccountSid: auth.subaccountSid,
      authToken: auth.authToken,
      from: fromPhone.e164Number,
      to: contact.phone,
      body: args.body,
    });
    msg.providerMessageId = result.sid;
    msg.sgMessageId = result.sid;
    msg.status = 'sent';
    await this.ds.getRepository(Message).save(msg);
    await this.recordUsage(tid, 'sms_sent', 1);
    return { messageId: msg.id };
  }

  /** Phase 13 stopgap — missed-call text-back until workflow engine (P15). */
  async sendMissedCallTextBack(tenantId: string, contactId: string, fromNumberId: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: contactId, tenantId: tid } });
    if (!contact?.phone || contact.smsOptInStatus === 'opted_out') return;
    if (contact.smsOptInStatus === 'unknown') contact.smsOptInStatus = 'opted_in';
    await this.ds.getRepository(Contact).save(contact);
    await this.send(tid, {
      contactId,
      fromNumberId,
      body: 'Sorry we missed your call — reply here or call us back when convenient.',
    });
  }

  async handleInboundSms(tenantId: string, params: Record<string, string>): Promise<void> {
    const tid = assertTenant(tenantId);
    const from = this.normalizePhone(params.From ?? '');
    const to = this.normalizePhone(params.To ?? '');
    const body = (params.Body ?? '').trim();
    const messageSid = params.MessageSid ?? params.SmsSid ?? null;

    const contact = await this.findOrCreateContactByPhone(tid, from);
    const lower = body.toLowerCase();
    if (STOP_WORDS.has(lower)) {
      contact.smsOptInStatus = 'opted_out';
      await this.ds.getRepository(Contact).save(contact);
    } else if (START_WORDS.has(lower)) {
      contact.smsOptInStatus = 'opted_in';
      await this.ds.getRepository(Contact).save(contact);
    }

    const msg = this.ds.getRepository(Message).create({
      tenantId: tid,
      kind: 'transactional',
      channel: 'sms',
      direction: 'inbound',
      fromEmail: contact.email,
      toEmail: 'inbound@veyrasend.local',
      fromPhone: from,
      toPhone: to,
      subject: '(SMS)',
      body,
      status: 'delivered',
      providerMessageId: messageSid,
      sgMessageId: messageSid,
      idempotencyKey: `inbound-sms-${messageSid ?? uuidv4()}`,
    });
    await this.ds.getRepository(Message).save(msg);
    await this.conversations.linkMessage(tid, contact.id, msg.id);
    await this.recordUsage(tid, 'sms_received', 1);
    await this.workflows.dispatch(tid, 'sms.received', { contactId: contact.id, messageId: msg.id }).catch(() => undefined);
  }

  private async recordUsage(tenantId: string, metric: string, qty: number): Promise<void> {
    const now = new Date();
    const periodStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const periodEnd = periodStart;
    const repo = this.ds.getRepository(UsageRecord);
    let row = await repo.findOne({ where: { tenantId, periodStart, provider: 'twilio', metric } });
    if (row) {
      row.quantity = String(Number(row.quantity) + qty);
    } else {
      row = repo.create({ tenantId, periodStart, periodEnd, provider: 'twilio', metric, quantity: String(qty) });
    }
    await repo.save(row);
  }
}
