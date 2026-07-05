import {
  BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Contact, Invoice, type InvoiceLineItem } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { MessagesService } from '../messages/messages.service';
import { StripeIntegrationService } from './stripe-integration.service';

function sumLineItems(items: InvoiceLineItem[]): number {
  return items.reduce((acc, li) => acc + li.quantity * li.unitAmountCents, 0);
}

function toInvoiceRow(inv: Invoice) {
  return {
    id: inv.id,
    contactId: inv.contactId,
    status: inv.status,
    lineItems: inv.lineItems,
    totalCents: Number(inv.totalCents),
    currency: inv.currency,
    paymentUrl: inv.paymentUrl,
    dueDate: inv.dueDate,
    paidAt: inv.paidAt?.toISOString() ?? null,
    createdAt: inv.createdAt.toISOString(),
  };
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly stripe: StripeIntegrationService,
    private readonly messages: MessagesService,
  ) {}

  async list(tenantId: string) {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Invoice).find({
      where: { tenantId: tid },
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return rows.map(toInvoiceRow);
  }

  async getById(tenantId: string, id: string) {
    const tid = assertTenant(tenantId);
    const inv = await this.ds.getRepository(Invoice).findOne({ where: { id, tenantId: tid } });
    if (!inv) throw new NotFoundException('Invoice not found in this tenant.');
    return toInvoiceRow(inv);
  }

  async create(
    tenantId: string,
    input: { contactId: string; lineItems: InvoiceLineItem[]; currency?: string; dueDate?: string | null },
  ) {
    const tid = assertTenant(tenantId);
    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: input.contactId, tenantId: tid } });
    if (!contact) throw new NotFoundException('Contact not found in this tenant.');
    if (!input.lineItems?.length) throw new BadRequestException('line_items_required');

    const total = sumLineItems(input.lineItems);
    if (total <= 0) throw new BadRequestException('invoice_total_must_be_positive');

    const inv = this.ds.getRepository(Invoice).create({
      tenantId: tid,
      contactId: input.contactId,
      status: 'draft',
      lineItems: input.lineItems,
      totalCents: String(total),
      currency: (input.currency ?? 'USD').toUpperCase(),
      dueDate: input.dueDate ?? null,
    });
    await this.ds.getRepository(Invoice).save(inv);
    return toInvoiceRow(inv);
  }

  async send(tenantId: string, actorUserId: string, id: string) {
    const tid = assertTenant(tenantId);
    const inv = await this.ds.getRepository(Invoice).findOne({ where: { id, tenantId: tid } });
    if (!inv) throw new NotFoundException('Invoice not found in this tenant.');
    if (inv.status !== 'draft') throw new BadRequestException('invoice_not_draft');

    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: inv.contactId, tenantId: tid } });
    if (!contact?.email) throw new BadRequestException('contact_has_no_email');

    const link = await this.stripe.stripe.createPaymentLink({
      currency: inv.currency,
      lineItems: inv.lineItems.map((li) => ({
        name: li.description,
        amountCents: li.unitAmountCents,
        quantity: li.quantity,
      })),
      metadata: {
        tenant_id: tid,
        invoice_id: inv.id,
        kind: 'invoice',
      },
    });

    inv.status = 'sent';
    inv.stripePaymentLinkId = link.id;
    inv.paymentUrl = link.url;
    await this.ds.getRepository(Invoice).save(inv);

    const amount = (Number(inv.totalCents) / 100).toFixed(2);
    await this.messages.send(tid, actorUserId, {
      fromEmail: 'billing@veyrasend.local',
      toEmail: contact.email,
      subject: `Invoice — ${amount} ${inv.currency}`,
      text: `You have an invoice for ${amount} ${inv.currency}. Pay here: ${link.url}`,
    });

    return toInvoiceRow(inv);
  }
}
