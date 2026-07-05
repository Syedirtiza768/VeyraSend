import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Tenant, TenantTwilioSettings } from '@veyrasend/db';
import { TwilioClient } from '@veyrasend/twilio';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { CryptoService } from '../../common/crypto.service';

export interface TwilioProvisionStatus {
  provisioned: boolean;
  subaccountSid: string | null;
  provisionedAt: string | null;
}

@Injectable()
export class TwilioIntegrationService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly crypto: CryptoService,
    private readonly client: TwilioClient,
  ) {}

  async getSettings(tenantId: string): Promise<TenantTwilioSettings | null> {
    return this.ds.getRepository(TenantTwilioSettings).findOne({ where: { tenantId: assertTenant(tenantId) } });
  }

  async requireSettings(tenantId: string): Promise<TenantTwilioSettings> {
    const s = await this.getSettings(tenantId);
    if (!s) throw new BadRequestException('Twilio is not provisioned for this tenant. Provision first.');
    return s;
  }

  async getDecryptedAuth(tenantId: string): Promise<{ subaccountSid: string; authToken: string }> {
    const s = await this.requireSettings(tenantId);
    return { subaccountSid: s.twilioSubaccountSid, authToken: this.crypto.decrypt(s.encryptedAuthToken) };
  }

  async getStatus(tenantId: string): Promise<TwilioProvisionStatus> {
    const s = await this.getSettings(tenantId);
    if (!s) return { provisioned: false, subaccountSid: null, provisionedAt: null };
    return { provisioned: true, subaccountSid: s.twilioSubaccountSid, provisionedAt: s.createdAt.toISOString() };
  }

  async provision(tenantId: string): Promise<TwilioProvisionStatus> {
    const tid = assertTenant(tenantId);
    const existing = await this.getSettings(tid);
    if (existing) {
      return { provisioned: true, subaccountSid: existing.twilioSubaccountSid, provisionedAt: existing.createdAt.toISOString() };
    }
    const tenant = await this.ds.getRepository(Tenant).findOne({ where: { id: tid } });
    if (!tenant) throw new NotFoundException('Tenant not found.');
    const sub = await this.client.createSubaccount({ friendlyName: `VeyraSend ${tenant.name}` });
    const row = this.ds.getRepository(TenantTwilioSettings).create({
      tenantId: tid,
      twilioSubaccountSid: sub.sid,
      encryptedAuthToken: this.crypto.encrypt(sub.authToken),
    });
    await this.ds.getRepository(TenantTwilioSettings).save(row);
    return { provisioned: true, subaccountSid: row.twilioSubaccountSid, provisionedAt: row.createdAt.toISOString() };
  }
}
