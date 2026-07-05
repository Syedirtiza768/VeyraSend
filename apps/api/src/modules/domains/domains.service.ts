import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Domain, type DomainDnsRecord } from '@veyrasend/db';
import { SendGridClient } from '@veyrasend/sendgrid';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { SendgridService } from '../sendgrid/sendgrid.service';

export interface DomainRow {
  id: string;
  domainId: string;
  domain: string;
  verified: boolean;
  dns: DomainDnsRecord[];
  createdAt: string;
}

function toRow(d: Domain): DomainRow {
  return {
    id: d.id,
    domainId: d.domainId,
    domain: d.domain,
    verified: d.verified,
    dns: d.dns ?? [],
    createdAt: d.createdAt.toISOString(),
  };
}

@Injectable()
export class DomainsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly client: SendGridClient,
    private readonly sendgrid: SendgridService,
  ) {}

  async list(tenantId: string): Promise<DomainRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Domain).find({
      where: { tenantId: tid },
      order: { createdAt: 'ASC' },
    });
    return rows.map(toRow);
  }

  async create(tenantId: string, domain: string): Promise<DomainRow> {
    const tid = assertTenant(tenantId);
    const settings = await this.sendgrid.requireSettings(tid);

    const existing = await this.ds.getRepository(Domain).findOne({
      where: { tenantId: tid, domain },
    });
    if (existing) {
      throw new ConflictException(`Domain '${domain}' already exists for this tenant.`);
    }

    const res = await this.client.createDomain({ subuserUsername: settings.subuserUsername, domain });

    const row = this.ds.getRepository(Domain).create({
      tenantId: tid,
      domainId: res.domainId,
      domain: res.domain,
      verified: res.verified,
      dns: res.dns,
    });
    await this.ds.getRepository(Domain).save(row);
    return toRow(row);
  }

  async getDns(tenantId: string, id: string): Promise<{ dns: DomainDnsRecord[]; verified: boolean }> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Domain).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Domain not found in this tenant.');
    return { dns: row.dns ?? [], verified: row.verified };
  }

  async verify(tenantId: string, id: string): Promise<{ verified: boolean; reason?: string }> {
    const tid = assertTenant(tenantId);
    const settings = await this.sendgrid.requireSettings(tid);
    const row = await this.ds.getRepository(Domain).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Domain not found in this tenant.');

    const res = await this.client.validateDomain({
      subuserUsername: settings.subuserUsername,
      domainId: row.domainId,
    });

    row.verified = res.valid;
    await this.ds.getRepository(Domain).save(row);
    return { verified: res.valid, reason: res.reason };
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const settings = await this.sendgrid.requireSettings(tid);
    const row = await this.ds.getRepository(Domain).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Domain not found in this tenant.');
    await this.client.deleteDomain({ subuserUsername: settings.subuserUsername, domainId: row.domainId });
    await this.ds.getRepository(Domain).delete({ id, tenantId: tid });
  }
}
