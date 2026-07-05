import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Deal, PipelineStage, type DealStatus } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { WorkflowDispatchService } from '../workflows/workflow-dispatch.service';

export interface DealRow {
  id: string;
  pipelineId: string;
  stageId: string;
  contactId: string | null;
  companyId: string | null;
  name: string;
  valueCents: string | null;
  currency: string;
  ownerUserId: string | null;
  status: DealStatus;
  expectedCloseDate: string | null;
  createdAt: string;
}

function toRow(d: Deal): DealRow {
  return {
    id: d.id, pipelineId: d.pipelineId, stageId: d.stageId, contactId: d.contactId,
    companyId: d.companyId, name: d.name, valueCents: d.valueCents, currency: d.currency,
    ownerUserId: d.ownerUserId, status: d.status,
    expectedCloseDate: d.expectedCloseDate, createdAt: d.createdAt.toISOString(),
  };
}

@Injectable()
export class DealsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @Inject(forwardRef(() => WorkflowDispatchService)) private readonly workflows: WorkflowDispatchService,
  ) {}

  async list(tenantId: string, filters: {
    pipelineId?: string; stageId?: string; ownerUserId?: string; status?: string; companyId?: string; contactId?: string;
  }): Promise<DealRow[]> {
    const tid = assertTenant(tenantId);
    const qb = this.ds.getRepository(Deal).createQueryBuilder('d').where('d.tenantId = :tid', { tid });
    if (filters.pipelineId) qb.andWhere('d.pipelineId = :pipelineId', { pipelineId: filters.pipelineId });
    if (filters.stageId) qb.andWhere('d.stageId = :stageId', { stageId: filters.stageId });
    if (filters.ownerUserId) qb.andWhere('d.ownerUserId = :ownerUserId', { ownerUserId: filters.ownerUserId });
    if (filters.status) qb.andWhere('d.status = :status', { status: filters.status });
    if (filters.companyId) qb.andWhere('d.companyId = :companyId', { companyId: filters.companyId });
    if (filters.contactId) qb.andWhere('d.contactId = :contactId', { contactId: filters.contactId });
    const rows = await qb.orderBy('d.createdAt', 'DESC').take(500).getMany();
    return rows.map(toRow);
  }

  async getById(tenantId: string, id: string): Promise<DealRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Deal).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Deal not found in this tenant.');
    return toRow(row);
  }

  private async assertStageInPipeline(tenantId: string, pipelineId: string, stageId: string): Promise<PipelineStage> {
    const stage = await this.ds.getRepository(PipelineStage).findOne({ where: { id: stageId, tenantId, pipelineId } });
    if (!stage) throw new BadRequestException('stage_pipeline_mismatch');
    return stage;
  }

  async create(tenantId: string, input: {
    pipelineId: string; stageId: string; name: string; contactId?: string | null;
    companyId?: string | null; valueCents?: string | null; ownerUserId?: string | null;
  }): Promise<DealRow> {
    const tid = assertTenant(tenantId);
    const name = input.name.trim();
    if (!name) throw new BadRequestException('name is required');
    await this.assertStageInPipeline(tid, input.pipelineId, input.stageId);
    const row = this.ds.getRepository(Deal).create({
      tenantId: tid, pipelineId: input.pipelineId, stageId: input.stageId, name,
      contactId: input.contactId ?? null, companyId: input.companyId ?? null,
      valueCents: input.valueCents ?? null, ownerUserId: input.ownerUserId ?? null, status: 'open',
    });
    await this.ds.getRepository(Deal).save(row);
    return toRow(row);
  }

  async update(tenantId: string, id: string, input: Partial<{
    name: string; contactId: string | null; companyId: string | null;
    valueCents: string | null; ownerUserId: string | null; expectedCloseDate: string | null;
  }>): Promise<DealRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Deal).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Deal not found in this tenant.');
    if (input.name !== undefined) row.name = input.name.trim() || row.name;
    if (input.contactId !== undefined) row.contactId = input.contactId;
    if (input.companyId !== undefined) row.companyId = input.companyId;
    if (input.valueCents !== undefined) row.valueCents = input.valueCents;
    if (input.ownerUserId !== undefined) row.ownerUserId = input.ownerUserId;
    if (input.expectedCloseDate !== undefined) row.expectedCloseDate = input.expectedCloseDate;
    await this.ds.getRepository(Deal).save(row);
    return toRow(row);
  }

  async move(tenantId: string, id: string, stageId: string): Promise<{ deal: DealRow; fromStageId: string }> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Deal).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Deal not found in this tenant.');
    const fromStageId = row.stageId;
    const stage = await this.assertStageInPipeline(tid, row.pipelineId, stageId);
    row.stageId = stageId;
    if (stage.isWon) row.status = 'won';
    else if (stage.isLost) row.status = 'lost';
    else row.status = 'open';
    await this.ds.getRepository(Deal).save(row);
    await this.workflows.dispatch(tid, 'pipeline_stage.changed', {
      dealId: row.id,
      fromStageId,
      toStageId: stageId,
      contactId: row.contactId,
      pipelineId: row.pipelineId,
    }).catch(() => undefined);
    return { deal: toRow(row), fromStageId };
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Deal).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Deal not found in this tenant.');
    await this.ds.getRepository(Deal).softDelete({ id, tenantId: tid });
  }
}
