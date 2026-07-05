import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Deal, Pipeline, PipelineStage } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

export interface StageRow {
  id: string;
  name: string;
  position: number;
  probability: number | null;
  isWon: boolean;
  isLost: boolean;
}

export interface PipelineRow {
  id: string;
  name: string;
  isDefault: boolean;
  stages: StageRow[];
  createdAt: string;
}

export interface StageInput {
  id?: string;
  name: string;
  position: number;
  probability?: number | null;
  isWon?: boolean;
  isLost?: boolean;
}

@Injectable()
export class PipelinesService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async list(tenantId: string): Promise<PipelineRow[]> {
    const tid = assertTenant(tenantId);
    const pipelines = await this.ds.getRepository(Pipeline).find({ where: { tenantId: tid }, order: { createdAt: 'ASC' } });
    if (pipelines.length === 0) return [];
    const stages = await this.ds.getRepository(PipelineStage).find({
      where: { tenantId: tid, pipelineId: In(pipelines.map((p) => p.id)) },
      order: { position: 'ASC' },
    });
    const byPipeline = new Map<string, StageRow[]>();
    for (const s of stages) {
      const list = byPipeline.get(s.pipelineId) ?? [];
      list.push({
        id: s.id, name: s.name, position: s.position, probability: s.probability,
        isWon: s.isWon, isLost: s.isLost,
      });
      byPipeline.set(s.pipelineId, list);
    }
    return pipelines.map((p) => ({
      id: p.id, name: p.name, isDefault: p.isDefault,
      stages: byPipeline.get(p.id) ?? [],
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async create(tenantId: string, name: string, stages: StageInput[]): Promise<PipelineRow> {
    const tid = assertTenant(tenantId);
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('name is required');
    if (stages.length === 0) throw new BadRequestException('At least one stage is required.');

    return this.ds.transaction(async (em) => {
      const pipeline = em.create(Pipeline, { tenantId: tid, name: trimmed });
      await em.save(Pipeline, pipeline);
      const savedStages: StageRow[] = [];
      for (const s of stages.sort((a, b) => a.position - b.position)) {
        const stage = em.create(PipelineStage, {
          tenantId: tid,
          pipelineId: pipeline.id,
          name: s.name.trim(),
          position: s.position,
          probability: s.probability ?? null,
          isWon: s.isWon ?? false,
          isLost: s.isLost ?? false,
        });
        await em.save(PipelineStage, stage);
        savedStages.push({
          id: stage.id, name: stage.name, position: stage.position, probability: stage.probability,
          isWon: stage.isWon, isLost: stage.isLost,
        });
      }
      return { id: pipeline.id, name: pipeline.name, isDefault: pipeline.isDefault, stages: savedStages, createdAt: pipeline.createdAt.toISOString() };
    });
  }

  async replaceStages(tenantId: string, pipelineId: string, stages: StageInput[]): Promise<PipelineRow> {
    const tid = assertTenant(tenantId);
    const pipeline = await this.ds.getRepository(Pipeline).findOne({ where: { id: pipelineId, tenantId: tid } });
    if (!pipeline) throw new NotFoundException('Pipeline not found in this tenant.');
    if (stages.length === 0) throw new BadRequestException('At least one stage is required.');

    return this.ds.transaction(async (em) => {
      const existing = await em.find(PipelineStage, { where: { tenantId: tid, pipelineId } });
      const existingIds = new Set(existing.map((s) => s.id));
      const incomingIds = new Set(stages.filter((s) => s.id).map((s) => s.id!));

      for (const old of existing) {
        if (!incomingIds.has(old.id)) {
          const dealCount = await em.count(Deal, { where: { tenantId: tid, stageId: old.id } });
          if (dealCount > 0) throw new ConflictException('Cannot remove a stage that still has deals.');
          await em.delete(PipelineStage, { id: old.id, tenantId: tid });
        }
      }

      const savedStages: StageRow[] = [];
      for (const s of stages.sort((a, b) => a.position - b.position)) {
        if (s.id && existingIds.has(s.id)) {
          await em.update(PipelineStage, { id: s.id, tenantId: tid }, {
            name: s.name.trim(), position: s.position, probability: s.probability ?? null,
            isWon: s.isWon ?? false, isLost: s.isLost ?? false,
          });
          const updated = await em.findOne(PipelineStage, { where: { id: s.id, tenantId: tid } });
          if (updated) savedStages.push({
            id: updated.id, name: updated.name, position: updated.position, probability: updated.probability,
            isWon: updated.isWon, isLost: updated.isLost,
          });
        } else {
          const stage = em.create(PipelineStage, {
            tenantId: tid, pipelineId, name: s.name.trim(), position: s.position,
            probability: s.probability ?? null, isWon: s.isWon ?? false, isLost: s.isLost ?? false,
          });
          await em.save(PipelineStage, stage);
          savedStages.push({
            id: stage.id, name: stage.name, position: stage.position, probability: stage.probability,
            isWon: stage.isWon, isLost: stage.isLost,
          });
        }
      }
      return { id: pipeline.id, name: pipeline.name, isDefault: pipeline.isDefault, stages: savedStages, createdAt: pipeline.createdAt.toISOString() };
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const pipeline = await this.ds.getRepository(Pipeline).findOne({ where: { id, tenantId: tid } });
    if (!pipeline) throw new NotFoundException('Pipeline not found in this tenant.');
    const dealCount = await this.ds.getRepository(Deal).count({ where: { tenantId: tid, pipelineId: id } });
    if (dealCount > 0) throw new ConflictException('pipeline_has_deals');
    await this.ds.getRepository(Pipeline).delete({ id, tenantId: tid });
  }
}
