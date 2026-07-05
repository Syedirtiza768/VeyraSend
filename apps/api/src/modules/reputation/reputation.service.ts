import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Contact, ReputationSettings, ReviewRequest } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { MessagesService } from '../messages/messages.service';
import { SmsService } from '../sms/sms.service';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class ReputationService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly messages: MessagesService,
    private readonly sms: SmsService,
    private readonly config: ConfigService,
  ) {}

  async getSettings(tenantId: string) {
    const tid = assertTenant(tenantId);
    const row = await this.ensureSettings(tid);
    return {
      googleReviewLink: row.googleReviewLink,
      widgetTestimonials: row.widgetTestimonials ?? [],
    };
  }

  async updateSettings(tenantId: string, patch: { googleReviewLink?: string | null; widgetTestimonials?: Array<{ quote: string; name: string }> }) {
    const tid = assertTenant(tenantId);
    const row = await this.ensureSettings(tid);
    if (patch.googleReviewLink !== undefined) row.googleReviewLink = patch.googleReviewLink;
    if (patch.widgetTestimonials !== undefined) row.widgetTestimonials = patch.widgetTestimonials;
    await this.ds.getRepository(ReputationSettings).save(row);
    return this.getSettings(tid);
  }

  async listRequests(tenantId: string) {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(ReviewRequest).find({ where: { tenantId: tid }, order: { createdAt: 'DESC' }, take: 200 });
    return rows.map((r) => ({
      id: r.id,
      contactId: r.contactId,
      channel: r.channel,
      status: r.status,
      sentAt: r.sentAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async sendRequest(tenantId: string, actorUserId: string, contactId: string, channel: 'email' | 'sms'): Promise<{ id: string }> {
    const tid = assertTenant(tenantId);
    const settings = await this.ensureSettings(tid);
    if (!settings.googleReviewLink) throw new BadRequestException('google_review_link_not_configured');
    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: contactId, tenantId: tid } });
    if (!contact) throw new NotFoundException('Contact not found in this tenant.');

    const req = this.ds.getRepository(ReviewRequest).create({
      tenantId: tid,
      contactId,
      channel,
      reviewLink: settings.googleReviewLink,
      status: 'sent',
    });
    await this.ds.getRepository(ReviewRequest).save(req);

    const tracked = `${this.publicApiBase()}/api/reputation/r/${req.id}`;
    const body = `We'd love your feedback! Leave a review: ${tracked}`;

    if (channel === 'email') {
      await this.messages.send(tid, actorUserId, {
        fromEmail: 'reviews@veyrasend.local',
        toEmail: contact.email,
        subject: 'We value your feedback',
        text: body,
      });
    } else {
      if (!contact.phone) throw new BadRequestException('contact_has_no_phone');
      const phones = await this.ds.query(`SELECT id FROM phone_numbers WHERE tenant_id = $1 LIMIT 1`, [tid]);
      const fromId = phones[0]?.id;
      if (!fromId) throw new BadRequestException('no_phone_number_configured');
      await this.sms.send(tid, { contactId, fromNumberId: fromId, body });
    }

    return { id: req.id };
  }

  async trackClick(id: string): Promise<string> {
    const req = await this.ds.getRepository(ReviewRequest).findOne({ where: { id } });
    if (!req) throw new NotFoundException('Review request not found.');
    if (req.status === 'sent') {
      req.status = 'clicked';
      await this.ds.getRepository(ReviewRequest).save(req);
    }
    return req.reviewLink;
  }

  private async ensureSettings(tenantId: string): Promise<ReputationSettings> {
    let row = await this.ds.getRepository(ReputationSettings).findOne({ where: { tenantId } });
    if (!row) {
      row = this.ds.getRepository(ReputationSettings).create({ tenantId, googleReviewLink: null, widgetTestimonials: [] });
      await this.ds.getRepository(ReputationSettings).save(row);
    }
    return row;
  }

  private publicApiBase(): string {
    return `http://localhost:${this.config.all.apiPort}`;
  }
}
