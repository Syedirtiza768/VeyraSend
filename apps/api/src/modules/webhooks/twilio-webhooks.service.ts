import { ForbiddenException, Injectable } from '@nestjs/common';
import { TwilioClient } from '@veyrasend/twilio';
import { PhoneNumbersService } from '../phone-numbers/phone-numbers.service';
import { SmsService } from '../sms/sms.service';
import { VoiceService } from '../voice/voice.service';
import { TwilioIntegrationService } from '../twilio/twilio-integration.service';

@Injectable()
export class TwilioWebhooksService {
  constructor(
    private readonly client: TwilioClient,
    private readonly phones: PhoneNumbersService,
    private readonly twilio: TwilioIntegrationService,
    private readonly sms: SmsService,
    private readonly voice: VoiceService,
  ) {}

  private async resolveTenant(params: Record<string, string>): Promise<string> {
    const to = params.To ?? params.Called ?? '';
    const phone = await this.phones.findByE164(this.sms.normalizePhone(to));
    if (!phone) throw new ForbiddenException('Unknown destination number.');
    return phone.tenantId;
  }

  async verifyAsync(url: string, params: Record<string, string>, signature: string, tenantId: string): Promise<void> {
    if (this.client.mockMode && signature === 'mock-valid-signature') return;
    const auth = await this.twilio.getDecryptedAuth(tenantId);
    if (!this.client.verifyWebhookSignature(url, params, signature, auth.authToken)) {
      throw new ForbiddenException('Invalid Twilio signature.');
    }
  }

  async ingestSms(url: string, params: Record<string, string>, signature: string): Promise<void> {
    const tenantId = await this.resolveTenant(params);
    await this.verifyAsync(url, params, signature, tenantId);
    await this.sms.handleInboundSms(tenantId, params);
  }

  async ingestVoice(url: string, params: Record<string, string>, signature: string): Promise<string> {
    const tenantId = await this.resolveTenant(params);
    await this.verifyAsync(url, params, signature, tenantId);
    const { twiml } = await this.voice.handleInboundCall(tenantId, params);
    return twiml;
  }

  async ingestVoiceStatus(url: string, params: Record<string, string>, signature: string): Promise<void> {
    const tenantId = await this.resolveTenant(params);
    await this.verifyAsync(url, params, signature, tenantId);
    await this.voice.handleStatusCallback(tenantId, params);
  }
}
