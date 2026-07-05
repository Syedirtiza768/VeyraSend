import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EmailEvent, Message, Contact, type MessageStatus, type SuppressionReason, type ContactStatus } from '@veyrasend/db';
import { EVENT_WEBHOOK_SIGNATURE_HEADER, EVENT_WEBHOOK_TIMESTAMP_HEADER, SendGridClient } from '@veyrasend/sendgrid';
import { InjectDataSource } from '../../common/db.module';
import { ContactsService } from '../contacts/contacts.service';
import { SuppressionsService } from '../suppressions/suppressions.service';
import { WorkflowDispatchService } from '../workflows/workflow-dispatch.service';

interface SgEvent {
  sg_event_id?: string;
  sg_message_id?: string;
  event?: string;
  email?: string;
  timestamp?: number;
  [k: string]: unknown;
}

const STATUS_BY_EVENT: Record<string, MessageStatus> = {
  delivered: 'delivered',
  bounce: 'bounced',
  deferred: 'deferred',
  dropped: 'failed',
  processed: 'sent',
};

const SUPPRESSION_BY_EVENT: Record<string, SuppressionReason> = {
  bounce: 'bounce',
  dropped: 'bounce',
  spamreport: 'complaint',
  unsubscribe: 'unsubscribe',
};

const CONTACT_STATUS_BY_EVENT: Record<string, ContactStatus> = {
  bounce: 'bounced',
  dropped: 'bounced',
  spamreport: 'complained',
  unsubscribe: 'unsubscribed',
};

/**
 * Ingests SendGrid event webhooks. Verifies the signature (when a verification
 * key is configured), dedupes by `sg_event_id`, attributes each event to a
 * tenant via the matching message's `sg_message_id`, and advances the message
 * ledger status. Unattributable events are skipped — never stored cross-tenant.
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger('WebhooksService');

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly client: SendGridClient,
    private readonly contacts: ContactsService,
    private readonly suppressions: SuppressionsService,
    @Inject(forwardRef(() => WorkflowDispatchService)) private readonly workflows: WorkflowDispatchService,
  ) {}

  headers() {
    return { signature: EVENT_WEBHOOK_SIGNATURE_HEADER, timestamp: EVENT_WEBHOOK_TIMESTAMP_HEADER };
  }

  async ingest(args: { rawBody: string; signature: string; timestamp: string; events: SgEvent[] }): Promise<{
    accepted: number;
    deduped: number;
    unattributed: number;
  }> {
    const valid = this.client.verifyEventWebhook(args.rawBody, args.signature, args.timestamp);
    if (!valid) {
      throw new Error('Invalid event webhook signature.');
    }

    let accepted = 0;
    let deduped = 0;
    let unattributed = 0;

    for (const ev of args.events) {
      const sgEventId = ev.sg_event_id;
      const sgMessageId = ev.sg_message_id ?? null;
      if (!sgEventId) continue; // nothing to dedupe against; skip

      // Attribute to tenant via the message ledger.
      let tenantId: string | null = null;
      if (sgMessageId) {
        const msg = await this.ds.getRepository(Message).findOne({
          where: { sgMessageId: sgMessageId },
        });
        if (msg) tenantId = msg.tenantId;
      }
      if (!tenantId) {
        unattributed++;
        continue;
      }

      const eventType = String(ev.event ?? 'unknown');
      const repo = this.ds.getRepository(EmailEvent);
      const existing = await repo.findOne({ where: { sgEventId } });
      if (existing) {
        deduped++;
        continue;
      }

      try {
        const row = repo.create({
          tenantId,
          eventType,
          sgMessageId,
          sgEventId,
          recipient: ev.email ?? null,
          sgTimestamp: ev.timestamp ?? null,
          raw: ev,
        });
        await repo.save(row);
        accepted++;
      } catch {
        // Unique constraint race — treat as dedupe.
        deduped++;
      }

      // Advance message ledger status.
      const newStatus = STATUS_BY_EVENT[eventType];
      if (newStatus && sgMessageId) {
        await this.ds.getRepository(Message).update(
          { sgMessageId, tenantId },
          { status: newStatus, reason: ev.reason ? String(ev.reason) : null },
        );
      }

      // Auto-record suppressions + update contact status for opt-out/bounce events.
      const supReason = SUPPRESSION_BY_EVENT[eventType];
      const recipient = ev.email ?? null;
      if (supReason && recipient) {
        try {
          await this.suppressions.add(tenantId, recipient, supReason, 'event');
        } catch (err) {
          this.logger.warn(`suppression write failed: ${(err as Error).message}`);
        }
        const contactStatus = CONTACT_STATUS_BY_EVENT[eventType];
        if (contactStatus) {
          try {
            await this.contacts.setStatusByEmail(tenantId, recipient, contactStatus);
          } catch (err) {
            this.logger.warn(`contact status update failed: ${(err as Error).message}`);
          }
        }
      }

      if (['open', 'click'].includes(eventType) && sgMessageId) {
        const msg = await this.ds.getRepository(Message).findOne({ where: { sgMessageId, tenantId } });
        if (msg) {
          const contact = await this.ds.getRepository(Contact).findOne({
            where: { tenantId, email: msg.toEmail.toLowerCase() },
          });
          if (contact) {
            const trigger = eventType === 'open' ? 'email.opened' : 'email.clicked';
            await this.workflows.dispatch(tenantId, trigger, {
              contactId: contact.id,
              messageId: msg.id,
            }).catch(() => undefined);
          }
        }
      }
    }

    this.logger.log(`events accepted=${accepted} deduped=${deduped} unattributed=${unattributed}`);
    return { accepted, deduped, unattributed };
  }
}
