import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Tenant, TenantSendgridSettings } from '@veyrasend/db';
import { SendGridClient, SUBUSER_API_KEY_SCOPES, type SubuserResult } from '@veyrasend/sendgrid';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { CryptoService } from '../../common/crypto.service';
import { randomBytes } from 'crypto';

export interface ProvisionStatus {
  provisioned: boolean;
  region: string | null;
  subuserUsername: string | null;
  provisionedAt: string | null;
}

@Injectable()
export class SendgridService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly crypto: CryptoService,
    private readonly client: SendGridClient,
  ) {}

  async getSettings(tenantId: string): Promise<TenantSendgridSettings | null> {
    const tid = assertTenant(tenantId);
    return this.ds.getRepository(TenantSendgridSettings).findOne({ where: { tenantId: tid } });
  }

  /** Returns the subuser settings or throws — senders/domains require a provisioned subuser. */
  async requireSettings(tenantId: string): Promise<TenantSendgridSettings> {
    const s = await this.getSettings(tenantId);
    if (!s) {
      throw new BadRequestException('SendGrid is not provisioned for this tenant. Provision first.');
    }
    return s;
  }

  /** Decrypted subuser API key for direct mail/transactional sends. */
  async getDecryptedApiKey(tenantId: string): Promise<{ apiKey: string; username: string }> {
    const s = await this.requireSettings(tenantId);
    return { apiKey: this.crypto.decrypt(s.encryptedApiKey), username: s.subuserUsername };
  }

  async getStatus(tenantId: string): Promise<ProvisionStatus> {
    const s = await this.getSettings(tenantId);
    if (!s) return { provisioned: false, region: null, subuserUsername: null, provisionedAt: null };
    return {
      provisioned: true,
      region: s.region,
      subuserUsername: s.subuserUsername,
      provisionedAt: s.createdAt.toISOString(),
    };
  }

  async provision(tenantId: string, ownerEmail: string): Promise<ProvisionStatus> {
    const tid = assertTenant(tenantId);
    const existing = await this.getSettings(tid);
    if (existing) {
      return {
        provisioned: true,
        region: existing.region,
        subuserUsername: existing.subuserUsername,
        provisionedAt: existing.createdAt.toISOString(),
      };
    }

    const tenant = await this.ds.getRepository(Tenant).findOne({ where: { id: tid } });
    if (!tenant) throw new NotFoundException('Tenant not found.');

    const rand = randomBytes(3).toString('hex');
    const username = `vs-${tenant.slug}-${rand}`.slice(0, 60);
    const password = randomBytes(18).toString('base64url');

    const subuser: SubuserResult = await this.client.createSubuser({
      username,
      email: ownerEmail,
      password,
    });

    const apiKeyRes = await this.client.createSubuserApiKey({
      subuserUsername: subuser.username,
      name: `veyrasend-tenant-${tenant.slug}`,
      scopes: SUBUSER_API_KEY_SCOPES,
    });

    const encrypted = this.crypto.encrypt(apiKeyRes.apiKey);
    const row = this.ds.getRepository(TenantSendgridSettings).create({
      tenantId: tid,
      subuserUsername: subuser.username,
      subuserId: subuser.subuserId,
      encryptedApiKey: encrypted,
      apiKeyId: apiKeyRes.keyId,
      region: subuser.region,
    });
    await this.ds.getRepository(TenantSendgridSettings).save(row);

    return {
      provisioned: true,
      region: row.region,
      subuserUsername: row.subuserUsername,
      provisionedAt: row.createdAt.toISOString(),
    };
  }
}
