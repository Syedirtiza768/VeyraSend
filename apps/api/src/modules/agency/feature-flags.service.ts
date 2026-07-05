import { Injectable } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { BillingPlan, FeatureFlag, Tenant } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

/**
 * Resolves feature flags with precedence: tenant override → billing plan default → global default.
 */
@Injectable()
export class FeatureFlagsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async listForTenant(tenantId: string): Promise<Array<{ key: string; enabled: boolean; source: string }>> {
    const tid = assertTenant(tenantId);
    const keys = await this.allKeys();
    const resolved = await Promise.all(keys.map(async (key) => {
      const r = await this.resolve(tid, key);
      return { key, enabled: r.enabled, source: r.source };
    }));
    return resolved;
  }

  async setTenantOverride(tenantId: string, key: string, enabled: boolean): Promise<void> {
    const tid = assertTenant(tenantId);
    const repo = this.ds.getRepository(FeatureFlag);
    let row = await repo.findOne({ where: { tenantId: tid, key } });
    if (row) {
      row.enabled = enabled;
    } else {
      row = repo.create({ tenantId: tid, key, enabled });
    }
    await repo.save(row);
  }

  async isEnabled(tenantId: string, key: string): Promise<boolean> {
    return (await this.resolve(tenantId, key)).enabled;
  }

  private async allKeys(): Promise<string[]> {
    const rows = await this.ds.getRepository(FeatureFlag).find({ where: { tenantId: IsNull() } });
    return rows.map((r) => r.key);
  }

  private async resolve(tenantId: string, key: string): Promise<{ enabled: boolean; source: string }> {
    const tenantFlag = await this.ds.getRepository(FeatureFlag).findOne({ where: { tenantId, key } });
    if (tenantFlag) return { enabled: tenantFlag.enabled, source: 'tenant' };

    const tenant = await this.ds.getRepository(Tenant).findOne({ where: { id: tenantId } });
    if (tenant?.billingPlanId) {
      const plan = await this.ds.getRepository(BillingPlan).findOne({ where: { id: tenant.billingPlanId } });
      if (plan?.featureFlags?.includes(key)) {
        return { enabled: true, source: 'plan' };
      }
    }

    const globalFlag = await this.ds.query(
      `SELECT enabled FROM feature_flags WHERE tenant_id IS NULL AND key = $1 LIMIT 1`,
      [key],
    );
    if (globalFlag[0]) {
      return { enabled: !!globalFlag[0].enabled, source: 'global' };
    }
    return { enabled: false, source: 'default' };
  }
}
