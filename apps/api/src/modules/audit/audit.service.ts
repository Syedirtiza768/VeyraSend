import { Inject, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditLog } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

export interface AuditInput {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  detail?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async record(input: AuditInput): Promise<void> {
    const tenantId = assertTenant(input.tenantId);
    try {
      const repo = this.ds.getRepository(AuditLog);
      const row = repo.create({
        tenantId,
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        detail: input.detail ?? null,
      });
      await repo.save(row);
    } catch (err) {
      // Audit must never break the request, but it must be visible if it fails.
      this.logger.error(`Audit write failed: ${(err as Error).message}`);
    }
  }
}
