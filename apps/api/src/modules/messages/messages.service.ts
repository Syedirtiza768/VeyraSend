import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { Message, type MessageKind } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { SendgridService } from '../sendgrid/sendgrid.service';
import { QueueService } from '../queue/queue.service';
import { AuditService } from '../audit/audit.service';

export interface SendTransactionInput {
  fromEmail: string;
  fromName?: string;
  toEmail: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
  unsubscribeGroupId?: number;
  sendAt?: Date;
}

export interface MessageRow {
  id: string;
  kind: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  status: string;
  sgMessageId: string | null;
  reason: string | null;
  createdAt: string;
}

function toRow(m: Message): MessageRow {
  return {
    id: m.id,
    kind: m.kind,
    fromEmail: m.fromEmail,
    toEmail: m.toEmail,
    subject: m.subject,
    status: m.status,
    sgMessageId: m.sgMessageId,
    reason: m.reason,
    createdAt: m.createdAt.toISOString(),
  };
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly sendgrid: SendgridService,
    private readonly queue: QueueService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, limit = 50): Promise<MessageRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Message).find({
      where: { tenantId: tid },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map(toRow);
  }

  async getById(tenantId: string, id: string): Promise<MessageRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Message).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Message not found in this tenant.');
    return toRow(row);
  }

  async send(tenantId: string, actorUserId: string | null, input: SendTransactionInput): Promise<MessageRow> {
    const tid = assertTenant(tenantId);
    // Sending requires a provisioned subuser (ADR-0001).
    await this.sendgrid.requireSettings(tid);

    if (!input.toEmail || !input.subject || !input.fromEmail) {
      throw new BadRequestException('fromEmail, toEmail and subject are required.');
    }

    const idempotencyKey = randomUUID();
    const row = this.ds.getRepository(Message).create({
      tenantId: tid,
      kind: 'transactional' as MessageKind,
      campaignId: null,
      fromEmail: input.fromEmail,
      toEmail: input.toEmail,
      subject: input.subject,
      status: 'queued',
      sgMessageId: null,
      idempotencyKey,
      reason: null,
    });
    await this.ds.getRepository(Message).save(row);

    await this.queue.add({
      tenantId: tid,
      messageId: row.id,
      idempotencyKey,
      spec: {
        fromEmail: input.fromEmail,
        fromName: input.fromName,
        toEmail: input.toEmail,
        subject: input.subject,
        html: input.html,
        text: input.text,
        templateId: input.templateId,
        dynamicTemplateData: input.dynamicTemplateData,
        unsubscribeGroupId: input.unsubscribeGroupId,
        sendAt: input.sendAt?.toISOString(),
      },
    });

    await this.audit.record({
      tenantId: tid,
      actorUserId,
      action: 'message.send',
      entityType: 'message',
      entityId: row.id,
      detail: { to: input.toEmail, subject: input.subject },
    });

    return toRow(row);
  }

  /**
   * Creates a campaign message ledger row and enqueues it. Used by the campaign
   * fan-out (Phase 6). No per-recipient audit (the campaign send is audited
   * once at the campaign level).
   */
  async enqueueCampaignMessage(
    tenantId: string,
    input: {
      campaignId: string;
      fromEmail: string;
      fromName?: string | null;
      toEmail: string;
      subject: string;
      html?: string;
      templateId?: string;
      dynamicTemplateData?: Record<string, unknown>;
    },
  ): Promise<{ id: string; idempotencyKey: string }> {
    const tid = assertTenant(tenantId);
    const idempotencyKey = randomUUID();
    const row = this.ds.getRepository(Message).create({
      tenantId: tid,
      kind: 'campaign' as MessageKind,
      campaignId: input.campaignId,
      fromEmail: input.fromEmail,
      toEmail: input.toEmail,
      subject: input.subject,
      status: 'queued',
      sgMessageId: null,
      idempotencyKey,
      reason: null,
    });
    await this.ds.getRepository(Message).save(row);

    await this.queue.add({
      tenantId: tid,
      messageId: row.id,
      idempotencyKey,
      spec: {
        fromEmail: input.fromEmail,
        fromName: input.fromName ?? undefined,
        toEmail: input.toEmail,
        subject: input.subject,
        html: input.html,
        templateId: input.templateId,
        dynamicTemplateData: input.dynamicTemplateData,
      },
    });

    return { id: row.id, idempotencyKey };
  }

  /**
   * Creates an automation message ledger row and enqueues it. Used by the
   * automation runner (Phase 8). No per-recipient audit.
   */
  async enqueueAutomationMessage(
    tenantId: string,
    input: {
      fromEmail: string;
      fromName?: string | null;
      toEmail: string;
      subject: string;
      html?: string;
      templateId?: string;
      dynamicTemplateData?: Record<string, unknown>;
    },
  ): Promise<{ id: string }> {
    const tid = assertTenant(tenantId);
    const idempotencyKey = randomUUID();
    const row = this.ds.getRepository(Message).create({
      tenantId: tid,
      kind: 'automation' as MessageKind,
      campaignId: null,
      fromEmail: input.fromEmail,
      toEmail: input.toEmail,
      subject: input.subject,
      status: 'queued',
      sgMessageId: null,
      idempotencyKey,
      reason: null,
    });
    await this.ds.getRepository(Message).save(row);
    await this.queue.add({
      tenantId: tid,
      messageId: row.id,
      idempotencyKey,
      spec: {
        fromEmail: input.fromEmail,
        fromName: input.fromName ?? undefined,
        toEmail: input.toEmail,
        subject: input.subject,
        html: input.html,
        templateId: input.templateId,
        dynamicTemplateData: input.dynamicTemplateData,
      },
    });
    return { id: row.id };
  }
}
