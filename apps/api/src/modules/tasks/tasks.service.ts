import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Task, type CrmEntityType, type TaskStatus } from '@veyrasend/db';
import { assertCrmEntityExists } from '../../common/crm-entity';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  status: TaskStatus;
  assigneeUserId: string | null;
  entityType: CrmEntityType;
  entityId: string;
  createdAt: string;
}

function toRow(t: Task): TaskRow {
  return {
    id: t.id, title: t.title, description: t.description,
    dueAt: t.dueAt?.toISOString() ?? null, status: t.status,
    assigneeUserId: t.assigneeUserId, entityType: t.entityType, entityId: t.entityId,
    createdAt: t.createdAt.toISOString(),
  };
}

@Injectable()
export class TasksService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async list(tenantId: string, filters: {
    entityType?: string; entityId?: string; assigneeUserId?: string; status?: string;
  }): Promise<TaskRow[]> {
    const tid = assertTenant(tenantId);
    const qb = this.ds.getRepository(Task).createQueryBuilder('t').where('t.tenantId = :tid', { tid });
    if (filters.entityType) qb.andWhere('t.entityType = :entityType', { entityType: filters.entityType });
    if (filters.entityId) qb.andWhere('t.entityId = :entityId', { entityId: filters.entityId });
    if (filters.assigneeUserId) qb.andWhere('t.assigneeUserId = :assigneeUserId', { assigneeUserId: filters.assigneeUserId });
    if (filters.status) qb.andWhere('t.status = :status', { status: filters.status });
    const rows = await qb.orderBy('t.dueAt', 'ASC', 'NULLS LAST').take(500).getMany();
    return rows.map(toRow);
  }

  async create(tenantId: string, input: {
    title: string; description?: string | null; dueAt?: string | null;
    assigneeUserId?: string | null; entityType: CrmEntityType; entityId: string;
  }): Promise<TaskRow> {
    const tid = assertTenant(tenantId);
    const title = input.title.trim();
    if (!title) throw new BadRequestException('title is required');
    await assertCrmEntityExists(this.ds, tid, input.entityType, input.entityId);
    const row = this.ds.getRepository(Task).create({
      tenantId: tid, title, description: input.description ?? null,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      assigneeUserId: input.assigneeUserId ?? null,
      entityType: input.entityType, entityId: input.entityId, status: 'open',
    });
    await this.ds.getRepository(Task).save(row);
    return toRow(row);
  }

  async update(tenantId: string, id: string, input: Partial<{
    title: string; description: string | null; dueAt: string | null;
    assigneeUserId: string | null; status: TaskStatus;
  }>): Promise<TaskRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Task).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Task not found in this tenant.');
    if (input.title !== undefined) row.title = input.title.trim() || row.title;
    if (input.description !== undefined) row.description = input.description;
    if (input.dueAt !== undefined) row.dueAt = input.dueAt ? new Date(input.dueAt) : null;
    if (input.assigneeUserId !== undefined) row.assigneeUserId = input.assigneeUserId;
    if (input.status !== undefined) row.status = input.status;
    await this.ds.getRepository(Task).save(row);
    return toRow(row);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Task).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Task not found in this tenant.');
    await this.ds.getRepository(Task).softDelete({ id, tenantId: tid });
  }
}
