import { BadRequestException, Injectable, Logger, NotFoundException, OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { Campaign, Message, EmailEvent, Segment, type CampaignStatus } from '@veyrasend/db';
import type { SegmentDefinition } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { SegmentsService } from '../segments/segments.service';
import { SuppressionsService } from '../suppressions/suppressions.service';
import { TemplatesService, render } from '../templates/templates.service';
import { MessagesService } from '../messages/messages.service';

export interface CampaignRow {
  id: string;
  name: string;
  templateId: string;
  segmentId: string;
  fromEmail: string;
  fromName: string | null;
  subject: string | null;
  status: CampaignStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  recipients: number;
  createdAt: string;
}

export interface CreateCampaignInput {
  name: string;
  templateId: string;
  segmentId: string;
  fromEmail: string;
  fromName?: string | null;
  subject?: string | null;
  scheduledAt?: string | null;
}

export interface CampaignStats {
  recipients: number;
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
}

function toRow(c: Campaign): CampaignRow {
  return {
    id: c.id,
    name: c.name,
    templateId: c.templateId,
    segmentId: c.segmentId,
    fromEmail: c.fromEmail,
    fromName: c.fromName,
    subject: c.subject,
    status: c.status,
    scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
    startedAt: c.startedAt ? c.startedAt.toISOString() : null,
    completedAt: c.completedAt ? c.completedAt.toISOString() : null,
    recipients: c.recipients,
    createdAt: c.createdAt.toISOString(),
  };
}

/**
 * Phase 6 — campaigns. A campaign fans out a template to a segment's
 * contacts, excluding suppressions and inactive contacts. Stats are reconciled
 * live from the message ledger + event log (Phase 9). Scheduled campaigns are
 * picked up by a periodic ticker.
 */
@Injectable()
export class CampaignsService implements OnApplicationShutdown {
  private readonly logger = new Logger('CampaignsService');
  private timer?: NodeJS.Timeout;

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly segments: SegmentsService,
    private readonly suppressions: SuppressionsService,
    private readonly templates: TemplatesService,
    private readonly messages: MessagesService,
  ) {
    this.timer = setInterval(() => this.tickScheduled().catch((e) => this.logger.warn(`ticker: ${e.message}`)), 20_000);
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async list(tenantId: string): Promise<CampaignRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Campaign).find({
      where: { tenantId: tid },
      order: { createdAt: 'DESC' },
    });
    return rows.map(toRow);
  }

  async getById(tenantId: string, id: string): Promise<CampaignRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Campaign).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Campaign not found in this tenant.');
    return toRow(row);
  }

  async create(tenantId: string, input: CreateCampaignInput): Promise<CampaignRow> {
    const tid = assertTenant(tenantId);
    if (!input.name.trim() || !input.templateId || !input.segmentId || !input.fromEmail) {
      throw new BadRequestException('name, templateId, segmentId, fromEmail are required');
    }
    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    const status: CampaignStatus = scheduledAt && scheduledAt.getTime() > Date.now() ? 'scheduled' : 'draft';
    const row = this.ds.getRepository(Campaign).create({
      tenantId: tid,
      name: input.name.trim(),
      templateId: input.templateId,
      segmentId: input.segmentId,
      fromEmail: input.fromEmail,
      fromName: input.fromName ?? null,
      subject: input.subject ?? null,
      status,
      scheduledAt,
      recipients: 0,
    });
    await this.ds.getRepository(Campaign).save(row);
    return toRow(row);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Campaign).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Campaign not found in this tenant.');
    await this.ds.getRepository(Campaign).softDelete({ id, tenantId: tid });
  }

  /** Schedule (or send now if scheduledAt is in the past/immediate). */
  async schedule(tenantId: string, id: string, scheduledAt: string | null): Promise<CampaignRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Campaign).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Campaign not found in this tenant.');
    if (row.status === 'sending' || row.status === 'sent') {
      throw new BadRequestException('Campaign has already been sent.');
    }
    const when = scheduledAt ? new Date(scheduledAt) : null;
    row.scheduledAt = when;
    row.status = when && when.getTime() > Date.now() ? 'scheduled' : 'draft';
    await this.ds.getRepository(Campaign).save(row);
    if (!when || when.getTime() <= Date.now()) {
      await this.sendNow(tid, row.id);
    }
    return this.getById(tid, row.id);
  }

  /** Immediately fan out the campaign to eligible recipients. */
  async sendNow(tenantId: string, id: string): Promise<CampaignRow> {
    const tid = assertTenant(tenantId);
    const campaign = await this.ds.getRepository(Campaign).findOne({ where: { id, tenantId: tid } });
    if (!campaign) throw new NotFoundException('Campaign not found in this tenant.');
    if (campaign.status === 'sent') throw new BadRequestException('Campaign already sent.');

    // Atomically claim via status guard (defends against duplicate scheduled sends).
    const claim = await this.ds
      .getRepository(Campaign)
      .createQueryBuilder()
      .update(Campaign)
      .set({ status: 'sending', startedAt: new Date() })
      .where('id = :id AND tenantId = :tid AND status IN (:...statuses)', {
        id,
        tid,
        statuses: ['draft', 'scheduled', 'failed'],
      })
      .execute();
    if (!claim.affected) {
      throw new BadRequestException('Campaign is already sending or sent.');
    }

    const template = await this.templates.getById(tid, campaign.templateId);
    const segment = await this.ds.getRepository(Segment).findOne({ where: { id: campaign.segmentId, tenantId: tid } });
    if (!segment) throw new NotFoundException('Segment not found.');

    const def = segment.definition as SegmentDefinition;
    const contacts = await this.segments.evaluateContacts(tid, def);
    const suppressed = await this.suppressions.suppressedEmails(tid);

    const eligible = contacts.filter((c) => c.status === 'active' && !suppressed.has(c.email));

    let sent = 0;
    for (const c of eligible) {
      const vars: Record<string, unknown> = {
        first_name: c.firstName ?? '',
        last_name: c.lastName ?? '',
        email: c.email,
        ...(c.customFields ?? {}),
      };
      const renderedSubject = campaign.subject ?? render(template.subject, vars, template.variables);
      const renderedHtml = render(template.html, vars, template.variables);
      await this.messages.enqueueCampaignMessage(tid, {
        campaignId: campaign.id,
        fromEmail: campaign.fromEmail,
        fromName: campaign.fromName,
        toEmail: c.email,
        subject: renderedSubject,
        html: renderedHtml,
        templateId: template.id,
        dynamicTemplateData: vars,
      });
      sent++;
    }

    await this.ds.getRepository(Campaign).update(
      { id, tenantId: tid },
      { status: 'sent', recipients: sent, completedAt: new Date() },
    );
    return this.getById(tid, id);
  }

  /** Live stats reconciled from the message ledger + event log. */
  async stats(tenantId: string, id: string): Promise<CampaignStats> {
    const tid = assertTenant(tenantId);
    const messages = await this.ds.getRepository(Message).find({ where: { tenantId: tid, campaignId: id } });
    const messageIds = messages.map((m) => m.sgMessageId).filter(Boolean) as string[];
    const statusCount = (s: string) => messages.filter((m) => m.status === s).length;

    let opens = 0;
    let clicks = 0;
    let unsubscribes = 0;
    if (messageIds.length > 0) {
      const events = await this.ds
        .getRepository(EmailEvent)
        .createQueryBuilder('e')
        .where('e.tenantId = :tid', { tid })
        .andWhere('e.sgMessageId IN (:...ids)', { ids: messageIds })
        .getMany();
      for (const e of events) {
        if (e.eventType === 'open') opens++;
        else if (e.eventType === 'click') clicks++;
        else if (e.eventType === 'unsubscribe') unsubscribes++;
      }
    }

    return {
      recipients: messages.length,
      sent: statusCount('sent') + statusCount('delivered'),
      delivered: statusCount('delivered'),
      bounced: statusCount('bounced'),
      failed: statusCount('failed'),
      opens,
      clicks,
      unsubscribes,
    };
  }

  private async tickScheduled(): Promise<void> {
    const due = await this.ds
      .getRepository(Campaign)
      .find({ where: { status: 'scheduled' as CampaignStatus } });
    const now = Date.now();
    for (const c of due) {
      if (c.scheduledAt && c.scheduledAt.getTime() <= now) {
        try {
          await this.sendNow(c.tenantId, c.id);
        } catch (err) {
          this.logger.warn(`scheduled send failed for ${c.id}: ${(err as Error).message}`);
        }
      }
    }
  }
}
