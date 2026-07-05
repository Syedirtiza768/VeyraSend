import { loadConfig, type AppConfig } from '@veyrasend/config';
import client from '@sendgrid/client';
import sgMail from '@sendgrid/mail';
import { EventWebhook, EventWebhookHeader } from '@sendgrid/eventwebhook';

/** SendGrid signed event-webhook header names. */
export const EVENT_WEBHOOK_SIGNATURE_HEADER = EventWebhookHeader.SIGNATURE();
export const EVENT_WEBHOOK_TIMESTAMP_HEADER = EventWebhookHeader.TIMESTAMP();

/**
 * packages/sendgrid is the ONLY place in the codebase permitted to call the
 * SendGrid API (ADR-0006, brief §11). Everything else goes through this
 * wrapper.
 *
 * Phase 2 implements subuser provisioning, subuser API keys, single-sender
 * verification, and domain authentication (DKIM/SPF). Mail send (Phase 3)
 * uses the MailSendRequest surface defined below.
 *
 * When `mockMode` is true (or no parent key is set) every method returns a
 * deterministic fake and makes no network call, so the full flow is demoable
 * without a SendGrid account. The same code path calls SendGrid when a real
 * parent key is supplied.
 */

// ---------------------------------------------------------------------------
// Mail send surface (Phase 3) — kept here so the wrapper is the single source.
// ---------------------------------------------------------------------------

export interface SendResult {
  messageId: string;
  accepted: boolean;
}

export interface MailPersonalization {
  to: string;
  variables?: Record<string, unknown>;
}

export interface MailSendRequest {
  /** Subuser-scoped API key to use for this send (per-tenant, ADR-0001). */
  subuserApiKey: string;
  from: { email: string; name?: string };
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
  personalizations: MailPersonalization[];
  /** Idempotency key so retries never double-send (brief §8). */
  idempotencyKey: string;
  sendAt?: Date;
  unsubscribeGroupId?: number;
}

// ---------------------------------------------------------------------------
// Subuser / sender / domain surfaces (Phase 2)
// ---------------------------------------------------------------------------

export interface SubuserResult {
  username: string;
  subuserId: string;
  region: string;
}

export interface SubuserApiKeyResult {
  apiKey: string;
  keyId: string;
}

export interface SenderResult {
  senderId: string;
  fromEmail: string;
  fromName?: string;
  replyTo: string;
  nickname?: string;
  verified: boolean;
  verificationStatus: 'pending' | 'verified' | 'failed';
}

export interface DnsRecord {
  host: string;
  type: 'TXT' | 'CNAME' | 'MX';
  data: string;
  valid?: boolean | null;
}

export interface DomainResult {
  domainId: string;
  domain: string;
  verified: boolean;
  dns: DnsRecord[];
}

export interface DomainValidationResult {
  valid: boolean;
  reason?: string;
  dns: DnsRecord[];
}

export class SendGridError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'SendGridError';
  }
}

/** Jittered exponential backoff for retryable (429/5xx) failures. */
export function backoffDelay(attempt: number, baseMs = 500, maxMs = 8000): number {
  const exp = Math.min(maxMs, baseMs * 2 ** attempt);
  const jitter = Math.floor(Math.random() * 250);
  return exp + jitter;
}

/** Scopes granted to a tenant's subuser API key (least privilege for send + marketing). */
export const SUBUSER_API_KEY_SCOPES = [
  'mail.send',
  'mail.batch.create',
  'mail.batch.read',
  'templates.create',
  'templates.read',
  'templates.update',
  'templates.delete',
  'marketing.create',
  'marketing.read',
  'marketing.update',
  'marketing.delete',
  'asm.groups.create',
  'asm.groups.read',
  'asm.groups.update',
  'suppressions.create',
  'suppressions.read',
  'suppressions.delete',
  'stats.read',
  'user.profile.read',
];

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method: RequestMethod;
  url: string;
  body?: unknown;
  /** Subuser username sent via the `on-behalf-of` header. */
  onBehalfOf?: string;
}

interface RawResponse<T> {
  statusCode: number;
  body: T;
}

export class SendGridClient {
  constructor(private readonly cfg: AppConfig['sendgrid']) {}

  get mockMode(): boolean {
    return this.cfg.mockMode || !this.cfg.parentApiKey;
  }

  // -- internal ---------------------------------------------------------------

  private async request<T>(opts: RequestOptions): Promise<RawResponse<T>> {
    if (this.mockMode) {
      throw new SendGridError('Mock mode does not make real requests.', undefined, false);
    }
    type SgResponse<T> = { statusCode: number; body: T };
    try {
      client.setApiKey(this.cfg.parentApiKey!);
      const headers: Record<string, string> = {};
      if (opts.onBehalfOf) headers['on-behalf-of'] = opts.onBehalfOf;
      const res = (await client.request({
        method: opts.method,
        url: opts.url,
        body: opts.body,
        headers,
      } as unknown as Parameters<typeof client.request>[0])) as unknown as SgResponse<T>;
      return { statusCode: res.statusCode, body: res.body };
    } catch (err) {
      const e = err as { response?: { statusCode?: number; body?: { errors?: { message?: string }[] } }; code?: number; message?: string };
      const status = e.response?.statusCode ?? e.code;
      const msg = e.response?.body?.errors?.[0]?.message ?? e.message ?? 'SendGrid request failed';
      const retryable = status === 429 || (typeof status === 'number' && status >= 500);
      throw new SendGridError(msg, status, retryable);
    }
  }

  // -- subusers ---------------------------------------------------------------

  async createSubuser(args: { username: string; email: string; password: string }): Promise<SubuserResult> {
    if (this.mockMode) {
      return {
        username: args.username,
        subuserId: `mock-subuser-${args.username}`,
        region: 'mock',
      };
    }
    const res = await this.request<{ id?: string }>({
      method: 'POST',
      url: '/subusers',
      body: { username: args.username, email: args.email, password: args.password, ips: [] },
    });
    if (res.statusCode >= 400) throw new SendGridError('Failed to create subuser', res.statusCode);
    return { username: args.username, subuserId: res.body.id ?? args.username, region: 'production' };
  }

  async createSubuserApiKey(args: { subuserUsername: string; name: string; scopes: string[] }): Promise<SubuserApiKeyResult> {
    if (this.mockMode) {
      return {
        apiKey: `mock-subuser-key-${args.subuserUsername}`,
        keyId: `mock-key-${args.subuserUsername}`,
      };
    }
    const res = await this.request<{ api_key: string; api_key_id: string }>({
      method: 'POST',
      url: '/api_keys',
      body: { name: args.name, scopes: args.scopes },
      onBehalfOf: args.subuserUsername,
    });
    return { apiKey: res.body.api_key, keyId: res.body.api_key_id };
  }

  // -- senders (Single Sender Verification) -----------------------------------

  async createSender(args: {
    subuserUsername: string;
    fromEmail: string;
    fromName?: string;
    replyTo: string;
    nickname?: string;
    address: string;
    city: string;
    country: string;
    company?: string;
  }): Promise<SenderResult> {
    if (this.mockMode) {
      return {
        senderId: `mock-sender-${Math.random().toString(36).slice(2, 10)}`,
        fromEmail: args.fromEmail,
        fromName: args.fromName,
        replyTo: args.replyTo,
        nickname: args.nickname,
        verified: false,
        verificationStatus: 'pending',
      };
    }
    const res = await this.request<{ id: number; from: { email: string; name?: string }; reply_to: string; nickname?: string; verified: { status: string } }>({
      method: 'POST',
      url: '/senders',
      onBehalfOf: args.subuserUsername,
      body: {
        from: { email: args.fromEmail, name: args.fromName },
        reply_to: args.replyTo,
        nickname: args.nickname,
        address: args.address,
        city: args.city,
        country: args.country,
        company: args.company,
        state: '',
        zip: '',
      },
    });
    const b = res.body;
    const status = b.verified?.status ?? 'pending';
    return {
      senderId: String(b.id),
      fromEmail: b.from.email,
      fromName: b.from.name,
      replyTo: b.reply_to,
      nickname: b.nickname,
      verified: status === 'verified',
      verificationStatus: status === 'verified' ? 'verified' : status === 'failed' ? 'failed' : 'pending',
    };
  }

  async deleteSender(args: { subuserUsername: string; senderId: string }): Promise<void> {
    if (this.mockMode) return;
    await this.request({ method: 'DELETE', url: `/senders/${args.senderId}`, onBehalfOf: args.subuserUsername });
  }

  async resendSenderVerification(args: { subuserUsername: string; senderId: string }): Promise<void> {
    if (this.mockMode) return;
    await this.request({ method: 'POST', url: `/senders/${args.senderId}/resend_verification`, onBehalfOf: args.subuserUsername });
  }

  // -- domain authentication (DKIM/SPF) ---------------------------------------

  async createDomain(args: { subuserUsername: string; domain: string }): Promise<DomainResult> {
    if (this.mockMode) {
      return mockDomain(args.domain);
    }
    const res = await this.request<{
      id: number;
      domain: string;
      dns: { mail_cname?: { host: string; data: string; valid: boolean }; mail?: { host: string; data: string; valid: boolean }; dkim1?: { host: string; data: string; valid: boolean }; dkim2?: { host: string; data: string; valid: boolean }; spf?: { host: string; data: string; valid: boolean } };
    }>({
      method: 'POST',
      url: '/whitelabel/domains',
      onBehalfOf: args.subuserUsername,
      body: { domain: args.domain, automatic_security: true, custom_spf: false, default: true },
    });
    return {
      domainId: String(res.body.id),
      domain: res.body.domain,
      verified: false,
      dns: normalizeDns(res.body.dns),
    };
  }

  async validateDomain(args: { subuserUsername: string; domainId: string }): Promise<DomainValidationResult> {
    if (this.mockMode) {
      // Mock: validation never passes (no real DNS), so the UI can show "pending".
      return { valid: false, reason: 'Mock mode — DNS not checked.', dns: [] };
    }
    const res = await this.request<{ valid: boolean; validation_results?: { mail_cname?: { valid: boolean }; dkim1?: { valid: boolean }; dkim2?: { valid: boolean }; spf?: { valid: boolean } } }>({
      method: 'POST',
      url: `/whitelabel/domains/${args.domainId}/validate`,
      onBehalfOf: args.subuserUsername,
    });
    return { valid: res.body.valid, dns: [] };
  }

  async deleteDomain(args: { subuserUsername: string; domainId: string }): Promise<void> {
    if (this.mockMode) return;
    await this.request({ method: 'DELETE', url: `/whitelabel/domains/${args.domainId}`, onBehalfOf: args.subuserUsername });
  }

  // -- mail send (Phase 3) ----------------------------------------------------

  async sendMail(req: MailSendRequest): Promise<SendResult> {
    if (this.mockMode) {
      return { messageId: `mock-${req.idempotencyKey}`, accepted: true };
    }
    sgMail.setApiKey(req.subuserApiKey);
    const body: Record<string, unknown> = {
      from: req.from,
      subject: req.subject,
      personalizations: req.personalizations.map((p) => ({
        to: [{ email: p.to }],
        dynamic_template_data: p.variables,
      })),
      custom_args: { idempotency_key: req.idempotencyKey },
    };
    if (req.html) body.html = req.html;
    if (req.text) body.text = req.text;
    if (req.templateId) body.template_id = req.templateId;
    if (req.dynamicTemplateData) body.dynamic_template_data = req.dynamicTemplateData;
    if (req.sendAt) body.send_at = Math.floor(req.sendAt.getTime() / 1000);
    if (req.unsubscribeGroupId) body.asm = { group_id: req.unsubscribeGroupId };

    try {
      const [res] = (await sgMail.send(body as unknown as Parameters<typeof sgMail.send>[0], false)) as unknown as [
        { headers?: { 'x-message-id'?: string } },
      ];
      const messageId = res.headers?.['x-message-id'] ?? req.idempotencyKey;
      return { messageId, accepted: true };
    } catch (err) {
      const e = err as { response?: { status?: number; body?: { errors?: { message?: string }[] } }; code?: number; message?: string };
      const status = e.response?.status ?? e.code;
      const msg = e.response?.body?.errors?.[0]?.message ?? e.message ?? 'SendGrid mail send failed';
      const retryable = status === 429 || (typeof status === 'number' && status >= 500);
      throw new SendGridError(msg, status, retryable);
    }
  }

  // -- event webhook verification --------------------------------------------

  /**
   * Verifies a signed SendGrid event webhook. In mock mode (no verification
   * key) this returns true — only acceptable for local dev where SendGrid
   * never calls the endpoint. With a real key it performs ECDSA verification
   * of `timestamp + payload`.
   */
  verifyEventWebhook(payload: string, signature: string, timestamp: string): boolean {
    const key = this.cfg.webhookVerificationKey;
    if (!key) return true; // mock/dev: accept injected events
    try {
      const ew = new EventWebhook();
      const pub = ew.convertPublicKeyToECDSA(key);
      return ew.verifySignature(pub, payload, signature, timestamp);
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockDomain(domain: string): DomainResult {
  const sub = `send.${domain}`;
  return {
    domainId: `mock-domain-${Math.random().toString(36).slice(2, 10)}`,
    domain,
    verified: false,
    dns: [
      { host: `s1._domainkey.${domain}`, type: 'TXT', data: `k=rsa; t=s; p=MOCK_DKIM1_KEY_FOR_${domain}`, valid: null },
      { host: `s2._domainkey.${domain}`, type: 'TXT', data: `k=rsa; t=s; p=MOCK_DKIM2_KEY_FOR_${domain}`, valid: null },
      { host: domain, type: 'TXT', data: 'v=spf1 include:sendgrid.net ~all', valid: null },
      { host: sub, type: 'CNAME', data: 'u123456.wl.sendgrid.net', valid: null },
    ],
  };
}

function normalizeDns(d: {
  mail_cname?: { host: string; data: string; valid: boolean };
  mail?: { host: string; data: string; valid: boolean };
  dkim1?: { host: string; data: string; valid: boolean };
  dkim2?: { host: string; data: string; valid: boolean };
  spf?: { host: string; data: string; valid: boolean };
}): DnsRecord[] {
  const out: DnsRecord[] = [];
  if (d.dkim1) out.push({ host: d.dkim1.host, type: 'TXT', data: d.dkim1.data, valid: d.dkim1.valid });
  if (d.dkim2) out.push({ host: d.dkim2.host, type: 'TXT', data: d.dkim2.data, valid: d.dkim2.valid });
  if (d.spf) out.push({ host: d.spf.host, type: 'TXT', data: d.spf.data, valid: d.spf.valid });
  if (d.mail_cname) out.push({ host: d.mail_cname.host, type: 'CNAME', data: d.mail_cname.data, valid: d.mail_cname.valid });
  return out;
}

let defaultClient: SendGridClient | undefined;

export function getSendGridClient(): SendGridClient {
  if (!defaultClient) {
    defaultClient = new SendGridClient(loadConfig().sendgrid);
  }
  return defaultClient;
}
