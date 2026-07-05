import { BadRequestException, Injectable } from '@nestjs/common';
import type Stripe from 'stripe';
import { StripeIntegrationService } from '../billing/stripe-integration.service';
import { BillingWebhookService } from '../billing/billing-webhook.service';

@Injectable()
export class StripeWebhooksService {
  constructor(
    private readonly stripe: StripeIntegrationService,
    private readonly billing: BillingWebhookService,
  ) {}

  async ingest(rawBody: string, signature: string): Promise<{ ok: true }> {
    let event: Stripe.Event;
    try {
      event = this.stripe.stripe.verifyWebhook(rawBody, signature);
    } catch (err) {
      throw new BadRequestException('Invalid Stripe webhook signature.');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = (session.metadata ?? {}) as Record<string, string>;
      const amountTotal = session.amount_total ?? 0;
      await this.billing.handleCheckoutCompleted(metadata, amountTotal);
    }

    return { ok: true };
  }
}
