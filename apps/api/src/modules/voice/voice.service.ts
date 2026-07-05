import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Call, Contact, VoicemailMessage } from '@veyrasend/db';
import { TwilioClient } from '@veyrasend/twilio';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { TwilioIntegrationService } from '../twilio/twilio-integration.service';
import { PhoneNumbersService } from '../phone-numbers/phone-numbers.service';
import { SmsService } from '../sms/sms.service';
import { ConversationsService } from '../conversations/conversations.service';
import { WorkflowDispatchService } from '../workflows/workflow-dispatch.service';

@Injectable()
export class VoiceService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly twilio: TwilioIntegrationService,
    private readonly phones: PhoneNumbersService,
    private readonly sms: SmsService,
    private readonly client: TwilioClient,
    private readonly conversations: ConversationsService,
    @Inject(forwardRef(() => WorkflowDispatchService)) private readonly workflows: WorkflowDispatchService,
  ) {}

  async list(tenantId: string) {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Call).find({ where: { tenantId: tid }, order: { createdAt: 'DESC' }, take: 200 });
    return rows.map((c) => ({
      id: c.id, direction: c.direction, fromNumber: c.fromNumber, toNumber: c.toNumber,
      status: c.status, durationSeconds: c.durationSeconds, disposition: c.disposition,
      contactId: c.contactId, createdAt: c.createdAt.toISOString(),
    }));
  }

  async getById(tenantId: string, id: string) {
    const call = await this.ds.getRepository(Call).findOne({ where: { id, tenantId: assertTenant(tenantId) } });
    if (!call) throw new NotFoundException('Call not found in this tenant.');
    const voicemail = await this.ds.getRepository(VoicemailMessage).findOne({ where: { callId: call.id, tenantId: call.tenantId } });
    return { ...call, voicemail: voicemail ?? null };
  }

  async initiateOutbound(tenantId: string, contactId: string, fromNumberId: string) {
    const tid = assertTenant(tenantId);
    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: contactId, tenantId: tid } });
    if (!contact?.phone) throw new BadRequestException('Contact has no phone number.');
    const fromPhone = await this.phones.getById(tid, fromNumberId);
    const auth = await this.twilio.getDecryptedAuth(tid);
    const callRow = this.ds.getRepository(Call).create({
      tenantId: tid,
      contactId: contact.id,
      phoneNumberId: fromNumberId,
      direction: 'outbound',
      fromNumber: fromPhone.e164Number,
      toNumber: contact.phone!,
      status: 'queued',
    });
    await this.ds.getRepository(Call).save(callRow);
    const result = await this.client.placeCall({
      subaccountSid: auth.subaccountSid,
      authToken: auth.authToken,
      from: fromPhone.e164Number,
      to: contact.phone!,
      url: '/api/webhooks/twilio/voice/connect',
      statusCallback: '/api/webhooks/twilio/voice/status',
      record: true,
    });
    callRow.twilioCallSid = result.sid;
    callRow.status = result.status;
    await this.ds.getRepository(Call).save(callRow);
    return { id: callRow.id, status: callRow.status };
  }

  generateInboundTwiml(forwardTo: string | null): string {
    if (forwardTo) {
      return this.client.generateTwiml([{ verb: 'Dial', number: forwardTo, record: true }]);
    }
    return this.client.generateTwiml([
      { verb: 'Say', text: 'Please leave a message after the tone.' },
      { verb: 'Record', maxLength: 120, transcribe: true },
    ]);
  }

  async handleStatusCallback(tenantId: string, params: Record<string, string>): Promise<void> {
    const tid = assertTenant(tenantId);
    const callSid = params.CallSid;
    if (!callSid) return;
    const call = await this.ds.getRepository(Call).findOne({ where: { tenantId: tid, twilioCallSid: callSid } });
    if (!call) return;
    call.status = params.CallStatus ?? call.status;
    if (params.CallDuration) call.durationSeconds = Number(params.CallDuration);
    await this.ds.getRepository(Call).save(call);

    await this.conversations.recordVoiceCall(tid, call);

    if (['no-answer', 'busy', 'failed'].includes(call.status) && call.contactId && call.direction === 'inbound') {
      await this.workflows.dispatch(tid, 'call.missed', {
        contactId: call.contactId,
        callId: call.id,
        fromNumberId: call.phoneNumberId,
      }).catch(() => undefined);
    }
  }

  async handleInboundCall(tenantId: string, params: Record<string, string>): Promise<{ twiml: string; callId: string }> {
    const tid = assertTenant(tenantId);
    const to = this.sms.normalizePhone(params.To ?? '');
    const from = this.sms.normalizePhone(params.From ?? '');
    const phone = await this.phones.findByE164(to);
    if (!phone) throw new NotFoundException('Number not configured.');
    const contact = await this.sms.findOrCreateContactByPhone(tid, from);
    const call = this.ds.getRepository(Call).create({
      tenantId: tid,
      contactId: contact.id,
      phoneNumberId: phone.id,
      direction: 'inbound',
      fromNumber: from,
      toNumber: to,
      status: 'ringing',
      twilioCallSid: params.CallSid ?? null,
    });
    await this.ds.getRepository(Call).save(call);
    await this.conversations.recordVoiceCall(tid, call);
    return { twiml: this.generateInboundTwiml(phone.forwardTo), callId: call.id };
  }

  async setDisposition(tenantId: string, id: string, disposition: string, note?: string) {
    const tid = assertTenant(tenantId);
    const call = await this.ds.getRepository(Call).findOne({ where: { id, tenantId: tid } });
    if (!call) throw new NotFoundException('Call not found in this tenant.');
    call.disposition = disposition;
    await this.ds.getRepository(Call).save(call);
    return call;
  }
}
