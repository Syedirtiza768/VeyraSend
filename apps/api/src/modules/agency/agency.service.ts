import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BillingPlan, Tenant, type WhiteLabelConfig } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { TenantsService, slugify } from '../tenants/tenants.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AgencyService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly tenants: TenantsService,
    private readonly audit: AuditService,
  ) {}

  private async requireAgency(tenantId: string): Promise<Tenant> {
    const tid = assertTenant(tenantId);
    const tenant = await this.ds.getRepository(Tenant).findOne({ where: { id: tid } });
    if (!tenant || tenant.type !== 'agency') {
      throw new ForbiddenException('Agency context required.');
    }
    return tenant;
  }

  async listSubAccounts(agencyTenantId: string) {
    const agency = await this.requireAgency(agencyTenantId);
    const rows = await this.ds.getRepository(Tenant).find({
      where: { parentTenantId: agency.id, type: 'sub_account' },
      order: { createdAt: 'DESC' },
    });
    return rows.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      billingPlanId: t.billingPlanId,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async createSubAccount(
    agencyTenantId: string,
    actorUserId: string,
    input: {
      name: string;
      slug?: string;
      ownerEmail: string;
      ownerPassword: string;
      ownerName?: string;
      billingPlanId?: string;
    },
  ) {
    const agency = await this.requireAgency(agencyTenantId);
    const slug = slugify(input.slug ?? input.name);
    if (!slug) throw new BadRequestException('invalid_slug');

    if (input.billingPlanId) {
      const plan = await this.ds.getRepository(BillingPlan).findOne({ where: { id: input.billingPlanId } });
      if (!plan) throw new NotFoundException('Billing plan not found.');
    }

    const { tenant, owner } = await this.tenants.createTenantWithOwner({
      name: input.name,
      slug,
      ownerEmail: input.ownerEmail,
      ownerPassword: input.ownerPassword,
      ownerName: input.ownerName ?? null,
      type: 'sub_account',
      parentTenantId: agency.id,
      billingPlanId: input.billingPlanId ?? null,
    });

    await this.audit.record({
      tenantId: agency.id,
      actorUserId,
      action: 'agency.sub_account.create',
      entityType: 'tenant',
      entityId: tenant.id,
      detail: { name: tenant.name, slug: tenant.slug },
    });

    return { id: tenant.id, name: tenant.name, slug: tenant.slug, ownerId: owner.id };
  }

  async validateActAs(agencyTenantId: string, subAccountId: string): Promise<Tenant> {
    const agency = await this.requireAgency(agencyTenantId);
    const sub = await this.ds.getRepository(Tenant).findOne({ where: { id: subAccountId } });
    if (!sub || sub.parentTenantId !== agency.id || sub.type !== 'sub_account') {
      throw new NotFoundException('Sub-account not found under this agency.');
    }
    return sub;
  }

  async getBranding(agencyTenantId: string) {
    const agency = await this.requireAgency(agencyTenantId);
    return agency.whiteLabelConfig ?? {};
  }

  async updateBranding(agencyTenantId: string, actorUserId: string, config: WhiteLabelConfig) {
    const agency = await this.requireAgency(agencyTenantId);
    agency.whiteLabelConfig = { ...(agency.whiteLabelConfig ?? {}), ...config };
    await this.ds.getRepository(Tenant).save(agency);
    await this.audit.record({
      tenantId: agency.id,
      actorUserId,
      action: 'agency.branding.update',
      entityType: 'tenant',
      entityId: agency.id,
      detail: config as Record<string, unknown>,
    });
    return agency.whiteLabelConfig;
  }

  async listBillingPlans() {
    const rows = await this.ds.getRepository(BillingPlan).find({ order: { priceCents: 'ASC' } });
    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      priceCents: Number(p.priceCents),
      interval: p.interval,
      includedUsage: p.includedUsage,
      featureFlags: p.featureFlags,
    }));
  }

  /** Prevent nesting: sub-accounts cannot have children. */
  async assertNoNesting(parentId: string): Promise<void> {
    const parent = await this.ds.getRepository(Tenant).findOne({ where: { id: parentId } });
    if (!parent) throw new NotFoundException('Parent tenant not found.');
    if (parent.type === 'sub_account') {
      throw new BadRequestException('nesting_not_allowed');
    }
  }
}
