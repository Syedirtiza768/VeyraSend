import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantSettings } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

export interface SettingsRow {
  webhookVerificationKey: string | null;
  eventRetentionDays: number;
  messageRetentionDays: number;
  inboundRetentionDays: number;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  webhookVerificationKey?: string | null;
  eventRetentionDays?: number;
  messageRetentionDays?: number;
  inboundRetentionDays?: number;
}

function toRow(s: TenantSettings): SettingsRow {
  return {
    webhookVerificationKey: s.webhookVerificationKey,
    eventRetentionDays: s.eventRetentionDays,
    messageRetentionDays: s.messageRetentionDays,
    inboundRetentionDays: s.inboundRetentionDays,
    updatedAt: s.updatedAt.toISOString(),
  };
}

@Injectable()
export class SettingsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async get(tenantId: string): Promise<SettingsRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ensure(tid);
    return toRow(row);
  }

  async getEntity(tenantId: string): Promise<TenantSettings> {
    return await this.ensure(assertTenant(tenantId));
  }

  async update(tenantId: string, input: UpdateSettingsInput): Promise<SettingsRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ensure(tid);
    if (input.webhookVerificationKey !== undefined) {
      row.webhookVerificationKey = input.webhookVerificationKey === '' ? null : input.webhookVerificationKey;
    }
    if (input.eventRetentionDays !== undefined) {
      if (input.eventRetentionDays < 1) throw new BadRequestException('eventRetentionDays must be >= 1');
      row.eventRetentionDays = input.eventRetentionDays;
    }
    if (input.messageRetentionDays !== undefined) {
      if (input.messageRetentionDays < 1) throw new BadRequestException('messageRetentionDays must be >= 1');
      row.messageRetentionDays = input.messageRetentionDays;
    }
    if (input.inboundRetentionDays !== undefined) {
      if (input.inboundRetentionDays < 1) throw new BadRequestException('inboundRetentionDays must be >= 1');
      row.inboundRetentionDays = input.inboundRetentionDays;
    }
    await this.ds.getRepository(TenantSettings).save(row);
    return toRow(row);
  }

  private async ensure(tid: string): Promise<TenantSettings> {
    const repo = this.ds.getRepository(TenantSettings);
    let row = await repo.findOne({ where: { tenantId: tid } });
    if (!row) {
      row = repo.create({ tenantId: tid, webhookVerificationKey: null, eventRetentionDays: 90, messageRetentionDays: 365, inboundRetentionDays: 90 });
      await repo.save(row);
    }
    return row;
  }
}
