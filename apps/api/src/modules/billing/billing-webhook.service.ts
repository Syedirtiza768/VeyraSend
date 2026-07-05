import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Invoice, UsageRecord } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { WorkflowDispatchService } from '../workflows/workflow-dispatch.service';
import { PaymentLinksService } from './payment-links.service';

@Injectable()
export class BillingWebhookService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @Inject(forwardRef(() => WorkflowDispatchService)) private readonly workflows: WorkflowDispatchService,
    @Inject(forwardRef(() => PaymentLinksService)) private readonly paymentLinks: PaymentLinksService,
  ) {}

  async handleCheckoutCompleted(metadata: Record<string, string>, amountTotalCents: number): Promise<void> {
    const tenantId = metadata.tenant_id;
    if (!tenantId) return;

    if (metadata.kind === 'invoice' && metadata.invoice_id) {
      await this.markInvoicePaid(tenantId, metadata.invoice_id);
      return;
    }

    if (metadata.kind === 'payment_link' && metadata.payment_link_id) {
      await this.paymentLinks.markPaidFromWebhook(tenantId, metadata.payment_link_id, amountTotalCents);
    }
  }

  async markInvoicePaid(tenantId: string, invoiceId: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const inv = await this.ds.getRepository(Invoice).findOne({ where: { id: invoiceId, tenantId: tid } });
    if (!inv || inv.status === 'paid') return;

    inv.status = 'paid';
    inv.paidAt = new Date();
    await this.ds.getRepository(Invoice).save(inv);

    const amountCents = Number(inv.totalCents);
    await this.recordStripeUsage(tid, 'invoice_paid', 1, amountCents);

    await this.workflows.dispatch(tid, 'invoice.paid', {
      contactId: inv.contactId,
      invoiceId: inv.id,
      amountCents,
      currency: inv.currency,
    }).catch(() => undefined);
  }

  private async recordStripeUsage(tenantId: string, metric: string, qty: number, amountCents: number): Promise<void> {
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
