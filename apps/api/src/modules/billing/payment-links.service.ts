import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { Contact, PaymentLink, UsageRecord } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { SmsService } from '../sms/sms.service';
import { PhoneNumbersService } from '../phone-numbers/phone-numbers.service';
import { StripeIntegrationService } from './stripe-integration.service';

function toRow(row: PaymentLink) {
  return {
    id: row.id,
    contactId: row.contactId,
    amountCents: Number(row.amountCents),
    currency: row.currency,
    description: row.description,
    paymentUrl: row.paymentUrl,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class PaymentLinksService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly stripe: StripeIntegrationService,
    private readonly sms: SmsService,
    private readonly phones: PhoneNumbersService,
  ) {}

  async list(tenantId: string) {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(PaymentLink).find({
      where: { tenantId: tid },
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return rows.map(toRow);
  }

  async create(
    tenantId: string,
    input: {
      amountCents: number;
      currency?: string;
      description?: string;
      contactId?: string;
      sendSms?: boolean;
    },
  ) {
    const tid = assertTenant(tenantId);
    if (input.amountCents <= 0) throw new BadRequestException('amount_must_be_positive');

    let contact: Contact | null = null;
    if (input.contactId) {
      contact = await this.ds.getRepository(Contact).findOne({ where: { id: input.contactId, tenantId: tid } });
      if (!contact) throw new NotFoundException('Contact not found in this tenant.');
    }

    const currency = (input.currency ?? 'USD').toUpperCase();
    const desc = input.description ?? 'Payment';
    const paymentLinkId = randomUUID();
    const link = await this.stripe.stripe.createPaymentLink({
      currency,
      lineItems: [{ name: desc, amountCents: input.amountCents, quantity: 1 }],
      metadata: {
        tenant_id: tid,
        payment_link_id: paymentLinkId,
        kind: 'payment_link',
      },
    });

    const row = this.ds.getRepository(PaymentLink).create({
      id: paymentLinkId,
      tenantId: tid,
      contactId: input.contactId ?? null,
      amountCents: String(input.amountCents),
      currency,
      description: desc,
      stripePaymentLinkId: link.id,
      paymentUrl: link.url,
      status: 'pending',
    });
    await this.ds.getRepository(PaymentLink).save(row);

    if (input.sendSms && contact?.phone) {
      const numbers = await this.phones.list(tenantId);
      const fromId = numbers[0]?.id;
      if (fromId) {
        const amount = (input.amountCents / 100).toFixed(2);
        await this.sms.send(tid, {
          contactId: contact.id,
          fromNumberId: fromId,
          body: `Pay ${amount} ${currency}: ${link.url}`,
        });
      }
    }

    return toRow(row);
  }

  async markPaidFromWebhook(tenantId: string, paymentLinkId: string, amountCents: number): Promise<void> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(PaymentLink).findOne({ where: { id: paymentLinkId, tenantId: tid } });
    if (!row || row.status === 'paid') return;
    row.status = 'paid';
    await this.ds.getRepository(PaymentLink).save(row);
    await this.recordUsage(tid, 'payment_collected', 1, amountCents);
  }

  private async recordUsage(tenantId: string, metric: string, qty: number, amountCents: number): Promise<void> {
    const now = new Date();
    const periodStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const repo = this.ds.getRepository(UsageRecord);
    let row = await repo.findOne({ where: { tenantId, periodStart, provider: 'stripe', metric } });
    if (row) {
      row.quantity = String(Number(row.quantity) + qty);
      row.costMicros = String(Number(row.costMicros ?? 0) + amountCents * 10_000);
    } else {
      row = repo.create({
        tenantId,
        periodStart,
        periodEnd: periodStart,
        provider: 'stripe',
        metric,
        quantity: String(qty),
        costMicros: String(amountCents * 10_000),
      });
    }
    await repo.save(row);
  }
}
