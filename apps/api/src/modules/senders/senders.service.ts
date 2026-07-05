import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Sender } from '@veyrasend/db';
import { SendGridClient } from '@veyrasend/sendgrid';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { SendgridService } from '../sendgrid/sendgrid.service';

export interface SenderRow {
  id: string;
  senderId: string;
  fromEmail: string;
  fromName: string | null;
  replyTo: string;
  nickname: string | null;
  verified: boolean;
  verificationStatus: string;
  createdAt: string;
}

export interface CreateSenderInput {
  fromEmail: string;
  fromName?: string;
  replyTo: string;
  nickname?: string;
  address: string;
  city: string;
  country: string;
  company?: string;
}

function toRow(s: Sender): SenderRow {
  return {
    id: s.id,
    senderId: s.senderId,
    fromEmail: s.fromEmail,
    fromName: s.fromName,
    replyTo: s.replyTo,
    nickname: s.nickname,
    verified: s.verified,
    verificationStatus: s.verificationStatus,
    createdAt: s.createdAt.toISOString(),
  };
}

@Injectable()
export class SendersService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly client: SendGridClient,
    private readonly sendgrid: SendgridService,
  ) {}

  async list(tenantId: string): Promise<SenderRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Sender).find({
      where: { tenantId: tid },
      order: { createdAt: 'ASC' },
    });
    return rows.map(toRow);
  }

  async create(tenantId: string, input: CreateSenderInput): Promise<SenderRow> {
    const tid = assertTenant(tenantId);
    const settings = await this.sendgrid.requireSettings(tid);

    const existing = await this.ds.getRepository(Sender).findOne({
      where: { tenantId: tid, fromEmail: input.fromEmail.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException(`Sender '${input.fromEmail}' already exists for this tenant.`);
    }

    const res = await this.client.createSender({
      subuserUsername: settings.subuserUsername,
      fromEmail: input.fromEmail,
      fromName: input.fromName,
      replyTo: input.replyTo,
      nickname: input.nickname,
      address: input.address,
      city: input.city,
      country: input.country,
      company: input.company,
    });

    const row = this.ds.getRepository(Sender).create({
      tenantId: tid,
      senderId: res.senderId,
      fromEmail: input.fromEmail.toLowerCase(),
      fromName: input.fromName ?? null,
      replyTo: input.replyTo,
      nickname: input.nickname ?? null,
      verified: res.verified,
      verificationStatus: res.verificationStatus,
    });
    await this.ds.getRepository(Sender).save(row);
    return toRow(row);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const settings = await this.sendgrid.requireSettings(tid);
    const row = await this.ds.getRepository(Sender).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Sender not found in this tenant.');
    await this.client.deleteSender({ subuserUsername: settings.subuserUsername, senderId: row.senderId });
    await this.ds.getRepository(Sender).delete({ id, tenantId: tid });
  }

  async resendVerification(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const settings = await this.sendgrid.requireSettings(tid);
    const row = await this.ds.getRepository(Sender).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Sender not found in this tenant.');
    await this.client.resendSenderVerification({ subuserUsername: settings.subuserUsername, senderId: row.senderId });
  }
}
