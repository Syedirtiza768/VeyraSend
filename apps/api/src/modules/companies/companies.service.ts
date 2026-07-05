import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Company, Contact } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

export interface CompanyRow {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  phone: string | null;
  address: Record<string, unknown> | null;
  ownerUserId: string | null;
  createdAt: string;
}

function toRow(c: Company): CompanyRow {
  return {
    id: c.id,
    name: c.name,
    domain: c.domain,
    industry: c.industry,
    phone: c.phone,
    address: c.address,
    ownerUserId: c.ownerUserId,
    createdAt: c.createdAt.toISOString(),
  };
}

@Injectable()
export class CompaniesService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async list(tenantId: string, q?: string, ownerUserId?: string): Promise<CompanyRow[]> {
    const tid = assertTenant(tenantId);
    const qb = this.ds.getRepository(Company).createQueryBuilder('c').where('c.tenantId = :tid', { tid });
    if (q?.trim()) qb.andWhere('c.name ILIKE :q', { q: `%${q.trim()}%` });
    if (ownerUserId) qb.andWhere('c.ownerUserId = :ownerUserId', { ownerUserId });
    const rows = await qb.orderBy('c.createdAt', 'DESC').take(200).getMany();
    return rows.map(toRow);
  }

  async getById(tenantId: string, id: string): Promise<CompanyRow & { contacts: { id: string; email: string; firstName: string | null; lastName: string | null }[] }> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Company).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Company not found in this tenant.');
    const contacts = await this.ds.getRepository(Contact).find({
      where: { tenantId: tid, companyId: id },
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return {
      ...toRow(row),
      contacts: contacts.map((c) => ({ id: c.id, email: c.email, firstName: c.firstName, lastName: c.lastName })),
    };
  }

  async create(tenantId: string, input: Partial<CompanyRow>): Promise<CompanyRow> {
    const tid = assertTenant(tenantId);
    const name = input.name?.trim();
    if (!name) throw new BadRequestException('name is required');
    const row = this.ds.getRepository(Company).create({
      tenantId: tid,
      name,
      domain: input.domain?.trim() || null,
      industry: input.industry?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address ?? null,
      ownerUserId: input.ownerUserId ?? null,
    });
    await this.ds.getRepository(Company).save(row);
    return toRow(row);
  }

  async update(tenantId: string, id: string, input: Partial<CompanyRow>): Promise<CompanyRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Company).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Company not found in this tenant.');
    if (input.name !== undefined) row.name = input.name.trim() || row.name;
    if (input.domain !== undefined) row.domain = input.domain?.trim() || null;
    if (input.industry !== undefined) row.industry = input.industry?.trim() || null;
    if (input.phone !== undefined) row.phone = input.phone?.trim() || null;
    if (input.address !== undefined) row.address = input.address;
    if (input.ownerUserId !== undefined) row.ownerUserId = input.ownerUserId;
    await this.ds.getRepository(Company).save(row);
    return toRow(row);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Company).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Company not found in this tenant.');
    await this.ds.getRepository(Contact).update({ tenantId: tid, companyId: id }, { companyId: null });
    await this.ds.getRepository(Company).softDelete({ id, tenantId: tid });
  }

  async findOrCreateByName(tenantId: string, name: string): Promise<Company> {
    const tid = assertTenant(tenantId);
    const trimmed = name.trim();
    const existing = await this.ds.getRepository(Company).findOne({ where: { tenantId: tid, name: trimmed } });
    if (existing) return existing;
    const row = this.ds.getRepository(Company).create({ tenantId: tid, name: trimmed });
    return this.ds.getRepository(Company).save(row);
  }
}
