import { z } from 'zod';

const boolString = z
  .string()
  .transform((v) => v === 'true' || v === '1')
  .pipe(z.boolean());

/**
 * Single source of truth for runtime configuration. Every required field is
 * non-optional here; if a required env var is missing or malformed the loader
 * throws a named, fail-fast error and the process refuses to boot.
 *
 * Never log raw values from this object. Secret fields are marked as such and
 * must never be serialized into responses or logs.
 */
export const configSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),

  apiPort: z.coerce.number().int().positive().default(4000),
  webPort: z.coerce.number().int().positive().default(3000),

  databaseUrl: z
    .string()
    .min(1, 'DATABASE_URL is required (postgres://user:pass@host:port/db)'),

  redisUrl: z
    .string()
    .min(1, 'REDIS_URL is required (redis://host:port)'),

  sessionSecret: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters'),

  sendgrid: z.object({
    mockMode: boolString.default('true'),
    // secret — never log
    parentApiKey: z.string().optional(),
    // secret — never log
    webhookVerificationKey: z.string().optional(),
    inboundParseDomain: z.string().optional(),
    // secret — shared secret query param for Inbound Parse hardening
    inboundParseSecret: z.string().optional(),
  }),

  twilio: z.object({
    mockMode: boolString.default('true'),
    accountSid: z.string().optional(),
    authToken: z.string().optional(),
    messagingServiceSid: z.string().optional(),
    voiceAppSid: z.string().optional(),
  }),

  stripe: z.object({
    mockMode: boolString.default('true'),
    // secret — platform secret key; never log
    secretKey: z.string().optional(),
    // secret — webhook signing secret; never log
    webhookSecret: z.string().optional(),
  }),

  // 32-byte hex key (64 hex chars) used to encrypt tenant SendGrid API keys at
  // rest. Required when SENDGRID_MOCK_MODE=false; optional in mock mode.
  encryptionKey: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
    .optional(),
});

export type AppConfig = z.infer<typeof configSchema>;

export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly missing: string[],
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Load and validate configuration from `process.env`. Throws ConfigError on
 * any failure — callers must not catch this to allow partial startup.
 */
export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const raw = {
    nodeEnv: env.NODE_ENV,
    apiPort: env.API_PORT,
    webPort: env.WEB_PORT,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    sessionSecret: env.SESSION_SECRET,
    sendgrid: {
      mockMode: env.SENDGRID_MOCK_MODE,
      parentApiKey: env.SENDGRID_PARENT_API_KEY,
      webhookVerificationKey: env.SENDGRID_WEBHOOK_VERIFICATION_KEY,
      inboundParseDomain: env.INBOUND_PARSE_DOMAIN,
      inboundParseSecret: env.SENDGRID_INBOUND_PARSE_SECRET,
    },
    twilio: {
      mockMode: env.TWILIO_MOCK_MODE,
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
      voiceAppSid: env.TWILIO_VOICE_APP_SID,
    },
    stripe: {
      mockMode: env.STRIPE_MOCK_MODE,
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    },
    encryptionKey: env.ENCRYPTION_KEY,
  };

  const parsed = configSchema.safeParse(raw);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.') || '(root)');
    const message = `Configuration validation failed. Fix the following before starting:\n  - ${parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n  - ')}`;
    throw new ConfigError(message, missing);
  }

  return parsed.data;
}

/** Field names that hold secrets and must never be logged or serialized. */
export const SECRET_FIELDS: ReadonlyArray<keyof AppConfig['sendgrid']> = [
  'parentApiKey',
  'webhookVerificationKey',
];

/** Returns a redacted, log-safe snapshot of the config. */
export function redactedConfig(config: AppConfig): unknown {
  return {
    nodeEnv: config.nodeEnv,
    apiPort: config.apiPort,
    webPort: config.webPort,
    databaseUrl: config.databaseUrl,
    redisUrl: config.redisUrl,
    sessionSecret: config.sessionSecret ? '[set]' : '[unset]',
    sendgrid: {
      mockMode: config.sendgrid.mockMode,
      parentApiKey: config.sendgrid.parentApiKey ? '[set]' : '[unset]',
      webhookVerificationKey: config.sendgrid.webhookVerificationKey
        ? '[set]'
        : '[unset]',
      inboundParseDomain: config.sendgrid.inboundParseDomain ?? '',
      inboundParseSecret: config.sendgrid.inboundParseSecret ? '[set]' : '[unset]',
    },
    twilio: {
      mockMode: config.twilio.mockMode,
      accountSid: config.twilio.accountSid ? '[set]' : '[unset]',
      authToken: config.twilio.authToken ? '[set]' : '[unset]',
    },
    stripe: {
      mockMode: config.stripe.mockMode,
      secretKey: config.stripe.secretKey ? '[set]' : '[unset]',
      webhookSecret: config.stripe.webhookSecret ? '[set]' : '[unset]',
    },
    encryptionKey: config.encryptionKey ? '[set]' : '[unset]',
  };
}
