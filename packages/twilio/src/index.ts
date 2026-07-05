import { createHmac, randomUUID } from 'crypto';
import { loadConfig } from '@veyrasend/config';

export class TwilioError extends Error {
  constructor(message: string, public readonly statusCode?: number, public readonly retryable = false) {
    super(message);
    this.name = 'TwilioError';
  }
}

export interface SubaccountResult {
  sid: string;
  friendlyName: string;
  authToken: string;
}

export interface AvailableNumber {
  e164: string;
  friendlyName: string;
}

export interface PhoneNumberResult {
  sid: string;
  e164: string;
}

export interface SmsSendRequest {
  subaccountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
  mediaUrl?: string[];
  statusCallback?: string;
}

export interface SmsSendResult {
  sid: string;
  status: string;
}

export interface CallRequest {
  subaccountSid: string;
  authToken: string;
  from: string;
  to: string;
  url: string;
  statusCallback?: string;
  record?: boolean;
}

export interface CallResult {
  sid: string;
  status: string;
}

export type TwimlInstruction =
  | { verb: 'Say'; text: string }
  | { verb: 'Dial'; number: string; record?: boolean }
  | { verb: 'Record'; maxLength?: number; transcribe?: boolean }
  | { verb: 'Hangup' };

/**
 * packages/twilio is the ONLY place permitted to call the Twilio API (ADR-0007).
 * Mock mode returns deterministic fakes when TWILIO_MOCK_MODE=true or credentials absent.
 */
export class TwilioClient {
  private readonly mock: boolean;
  private readonly parentSid: string | undefined;
  private readonly parentAuthToken: string | undefined;

  constructor(cfg = loadConfig()) {
    this.mock = cfg.twilio.mockMode || !cfg.twilio.authToken;
    this.parentSid = cfg.twilio.accountSid;
    this.parentAuthToken = cfg.twilio.authToken;
  }

  get mockMode(): boolean {
    return this.mock;
  }

  async createSubaccount(args: { friendlyName: string }): Promise<SubaccountResult> {
    if (this.mock) {
      return {
        sid: `ACmock${randomUUID().replace(/-/g, '').slice(0, 24)}`,
        friendlyName: args.friendlyName,
        authToken: `mock_auth_${randomUUID().slice(0, 16)}`,
      };
    }
    throw new TwilioError('Real Twilio subaccount provisioning requires TWILIO_MOCK_MODE=false and credentials.');
  }

  async searchAvailableNumbers(_args: { subaccountSid: string; authToken: string; areaCode?: string }): Promise<AvailableNumber[]> {
    if (this.mock) {
      return [
        { e164: '+15551234001', friendlyName: '(555) 123-4001' },
        { e164: '+15551234002', friendlyName: '(555) 123-4002' },
      ];
    }
    return [];
  }

  async purchaseNumber(args: { subaccountSid: string; authToken: string; e164Number: string }): Promise<PhoneNumberResult> {
    if (this.mock) {
      return { sid: `PNmock${randomUUID().replace(/-/g, '').slice(0, 24)}`, e164: args.e164Number };
    }
    throw new TwilioError('Real number purchase not configured in this build.');
  }

  async releaseNumber(_args: { subaccountSid: string; authToken: string; numberSid: string }): Promise<void> {
    if (this.mock) return;
    throw new TwilioError('Real number release not configured.');
  }

  async sendSms(req: SmsSendRequest): Promise<SmsSendResult> {
    if (this.mock) {
      return { sid: `SMmock${randomUUID().replace(/-/g, '').slice(0, 24)}`, status: 'queued' };
    }
    throw new TwilioError('Real SMS send not configured.');
  }

  async placeCall(req: CallRequest): Promise<CallResult> {
    if (this.mock) {
      return { sid: `CAmock${randomUUID().replace(/-/g, '').slice(0, 24)}`, status: 'queued' };
    }
    throw new TwilioError('Real call placement not configured.');
  }

  generateTwiml(instructions: TwimlInstruction[]): string {
    const parts = instructions.map((i) => {
      if (i.verb === 'Say') return `<Say>${escapeXml(i.text)}</Say>`;
      if (i.verb === 'Dial') return `<Dial${i.record ? ' record="record-from-answer"' : ''}>${escapeXml(i.number)}</Dial>`;
      if (i.verb === 'Record') return `<Record maxLength="${i.maxLength ?? 120}"${i.transcribe ? ' transcribe="true"' : ''}/>`;
      return '<Hangup/>';
    });
    return `<?xml version="1.0" encoding="UTF-8"?><Response>${parts.join('')}</Response>`;
  }

  verifyWebhookSignature(url: string, params: Record<string, string>, signatureHeader: string, authToken: string): boolean {
    if (this.mock && signatureHeader === 'mock-valid-signature') return true;
    const data = Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + params[key], url);
    const expected = createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
    return expected === signatureHeader;
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let singleton: TwilioClient | undefined;

export function getTwilioClient(): TwilioClient {
  if (!singleton) singleton = new TwilioClient();
  return singleton;
}

export { TwilioClient as default };
