import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import { loadConfig, type AppConfig } from '@veyrasend/config';

export class StripeError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'StripeError';
  }
}

export interface PaymentLinkLineItem {
  name: string;
  amountCents: number;
  quantity?: number;
}

export interface CreatePaymentLinkRequest {
  lineItems: PaymentLinkLineItem[];
  currency: string;
  metadata: Record<string, string>;
}

export interface PaymentLinkResult {
  id: string;
  url: string;
}

/**
 * packages/stripe is the ONLY place permitted to call the Stripe API.
 * Mock mode returns deterministic fakes when STRIPE_MOCK_MODE=true or no secret key.
 */
export class StripeClient {
  private readonly stripe: Stripe | null;

  constructor(private readonly cfg: AppConfig['stripe']) {
    this.stripe = !this.mockMode && cfg.secretKey
      ? new Stripe(cfg.secretKey, { apiVersion: '2025-02-24.acacia' })
      : null;
  }

  get mockMode(): boolean {
    return this.cfg.mockMode || !this.cfg.secretKey;
  }

  async createPaymentLink(req: CreatePaymentLinkRequest): Promise<PaymentLinkResult> {
    if (this.mockMode) {
      const id = `mock_pl_${randomUUID().slice(0, 12)}`;
      return { id, url: `https://checkout.stripe.mock/pay/${id}` };
    }

    try {
      const prices = await Promise.all(
        req.lineItems.map(async (item) => {
          const price = await this.stripe!.prices.create({
            currency: req.currency.toLowerCase(),
            unit_amount: item.amountCents,
            product_data: { name: item.name },
          });
          return { price: price.id, quantity: item.quantity ?? 1 };
        }),
      );

      const link = await this.stripe!.paymentLinks.create({
        line_items: prices,
        metadata: req.metadata,
      });

      return { id: link.id, url: link.url ?? '' };
    } catch (err) {
      throw toStripeError(err);
    }
  }

  /**
   * Verifies a Stripe webhook signature. In mock/dev without a webhook secret,
   * returns true so local tests can inject events — never acceptable in production
   * with real payments.
   */
  verifyWebhook(rawBody: string, signature: string): Stripe.Event {
    if (this.mockMode) {
      if (signature !== 'mock-valid-signature') {
        throw new StripeError('Invalid webhook signature', 400);
      }
      return JSON.parse(rawBody) as Stripe.Event;
    }

    const secret = this.cfg.webhookSecret;
    if (!secret) {
      throw new StripeError('STRIPE_WEBHOOK_SECRET is required when mock mode is off.');
    }
    try {
      return Stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      throw new StripeError(
        err instanceof Error ? err.message : 'Invalid webhook signature',
        400,
        false,
      );
    }
  }
}

function toStripeError(err: unknown): StripeError {
  if (err instanceof Stripe.errors.StripeError) {
    const retryable = err.statusCode === 429 || (err.statusCode ?? 0) >= 500;
    return new StripeError(err.message, err.statusCode, retryable);
  }
  return new StripeError(err instanceof Error ? err.message : 'Stripe request failed');
}

let defaultClient: StripeClient | undefined;

export function getStripeClient(): StripeClient {
  if (!defaultClient) {
    defaultClient = new StripeClient(loadConfig().stripe);
  }
  return defaultClient;
}
