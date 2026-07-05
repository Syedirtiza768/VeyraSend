import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  Workflow, WorkflowVersion, WorkflowTrigger, WorkflowAction, WorkflowRun, WorkflowRunStep,
  type WorkflowDefinition, type WorkflowStatus,
} from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import {
  compileStepsToGraph, extractActionNodes, validateWorkflowDefinition,
} from './workflow-definition';
import { WorkflowDispatchService } from './workflow-dispatch.service';

export interface WorkflowRow {
  id: string;
  name: string;
  status: WorkflowStatus;
  currentVersionId: string | null;
  draftVersion: { id: string; version: number; definition: WorkflowDefinition } | null;
  publishedVersion: { id: string; version: number; definition: WorkflowDefinition } | null;
  createdAt: string;
}

function toRow(
  wf: Workflow,
  draft: WorkflowVersion | null,
  published: WorkflowVersion | null,
): WorkflowRow {
  return {
    id: wf.id,
    name: wf.name,
    status: wf.status,
    currentVersionId: wf.currentVersionId,
    draftVersion: draft ? { id: draft.id, version: draft.version, definition: draft.definition } : null,
    publishedVersion: published ? { id: published.id, version: published.version, definition: published.definition } : null,
    createdAt: wf.createdAt.toISOString(),
  };
}

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly dispatch: WorkflowDispatchService,
  ) {}

  async list(tenantId: string): Promise<WorkflowRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Workflow).find({
      where: { tenantId: tid },
      order: { createdAt: 'DESC' },
    });
    const out: WorkflowRow[] = [];
    for (const wf of rows) {
      const { draft, published } = await this.loadVersions(tid, wf);
      out.push(toRow(wf, draft, published));
    }
    return out;
  }

  async getById(tenantId: string, id: string): Promise<WorkflowRow> {
    const tid = assertTenant(tenantId);
    const wf = await this.ds.getRepository(Workflow).findOne({ where: { id, tenantId: tid } });
    if (!wf) throw new NotFoundException('Workflow not found in this tenant.');
    const { draft, published } = await this.loadVersions(tid, wf);
    return toRow(wf, draft, published);
  }

  async create(tenantId: string, name: string, definition: WorkflowDefinition, userId?: string): Promise<WorkflowRow> {
    const tid = assertTenant(tenantId);
    if (!name.trim()) throw new BadRequestException('name is required');
    validateWorkflowDefinition(definition);

    const wf = this.ds.getRepository(Workflow).create({
      tenantId: tid,
      name: name.trim(),
      status: 'draft',
      currentVersionId: null,
    });
    await this.ds.getRepository(Workflow).save(wf);

    const ver = this.ds.getRepository(WorkflowVersion).create({
      tenantId: tid,
      workflowId: wf.id,
      version: 1,
      definition,
      createdByUserId: userId ?? null,
    });
    await this.ds.getRepository(WorkflowVersion).save(ver);
    return toRow(wf, ver, null);
  }

  async updateDraft(tenantId: string, id: string, definition: WorkflowDefinition, userId?: string): Promise<WorkflowRow> {
    const tid = assertTenant(tenantId);
    validateWorkflowDefinition(definition);
    const wf = await this.ds.getRepository(Workflow).findOne({ where: { id, tenantId: tid } });
    if (!wf) throw new NotFoundException('Workflow not found in this tenant.');

    let draft = await this.getDraftVersion(tid, wf);
    if (!draft) {
      const maxVer = await this.ds.getRepository(WorkflowVersion).maximum('version', { workflowId: wf.id, tenantId: tid });
      draft = this.ds.getRepository(WorkflowVersion).create({
        tenantId: tid,
        workflowId: wf.id,
        version: (maxVer ?? 0) + 1,
        definition,
        createdByUserId: userId ?? null,
      });
    } else {
      draft.definition = definition;
    }
    await this.ds.getRepository(WorkflowVersion).save(draft);
    const published = wf.currentVersionId
      ? await this.ds.getRepository(WorkflowVersion).findOne({ where: { id: wf.currentVersionId, tenantId: tid } })
      : null;
    return toRow(wf, draft, published);
  }

  async publish(tenantId: string, id: string): Promise<WorkflowRow> {
    const tid = assertTenant(tenantId);
    const wf = await this.ds.getRepository(Workflow).findOne({ where: { id, tenantId: tid } });
    if (!wf) throw new NotFoundException('Workflow not found in this tenant.');
    const draft = await this.getDraftVersion(tid, wf);
    if (!draft) throw new BadRequestException('No draft version to publish.');

    wf.currentVersionId = draft.id;
    wf.status = 'published';
    await this.ds.getRepository(Workflow).save(wf);

    await this.syncTriggersAndActions(tid, wf.id, draft);
    return toRow(wf, null, draft);
  }

  async setPaused(tenantId: string, id: string, paused: boolean): Promise<WorkflowRow> {
    const tid = assertTenant(tenantId);
    const wf = await this.ds.getRepository(Workflow).findOne({ where: { id, tenantId: tid } });
    if (!wf) throw new NotFoundException('Workflow not found in this tenant.');
    if (wf.status === 'archived') throw new BadRequestException('Cannot change archived workflow.');
    wf.status = paused ? 'paused' : 'published';
    await this.ds.getRepository(Workflow).save(wf);
    const { draft, published } = await this.loadVersions(tid, wf);
    return toRow(wf, draft, published);
  }

  async testRun(tenantId: string, id: string, contactId: string): Promise<{ runIds: string[] }> {
    const tid = assertTenant(tenantId);
    const wf = await this.ds.getRepository(Workflow).findOne({ where: { id, tenantId: tid } });
    if (!wf) throw new NotFoundException('Workflow not found in this tenant.');
    const draft = await this.getDraftVersion(tid, wf);
    const version = draft ?? (wf.currentVersionId
      ? await this.ds.getRepository(WorkflowVersion).findOne({ where: { id: wf.currentVersionId, tenantId: tid } })
      : null);
    if (!version) throw new BadRequestException('No workflow definition to test.');
    const runIds = await this.dispatch.dispatch(tid, 'manual', { contactId }, {
      dryRun: true,
      workflowId: wf.id,
      versionId: version.id,
    });
    return { runIds };
  }

  async listRuns(tenantId: string, workflowId: string, status?: string) {
    const tid = assertTenant(tenantId);
    const where: Record<string, unknown> = { tenantId: tid, workflowId };
    if (status) where.status = status;
    const rows = await this.ds.getRepository(WorkflowRun).find({
      where: where as never,
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return rows.map((r) => ({
      id: r.id,
      workflowId: r.workflowId,
      workflowVersionId: r.workflowVersionId,
      contactId: r.contactId,
      status: r.status,
      dryRun: r.dryRun,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async runSteps(tenantId: string, runId: string) {
    const tid = assertTenant(tenantId);
    const run = await this.ds.getRepository(WorkflowRun).findOne({ where: { id: runId, tenantId: tid } });
    if (!run) throw new NotFoundException('Workflow run not found.');
    const steps = await this.ds.getRepository(WorkflowRunStep).find({
      where: { tenantId: tid, workflowRunId: runId },
      order: { createdAt: 'ASC' },
    });
    return steps.map((s) => ({
      id: s.id,
      nodeId: s.nodeId,
      status: s.status,
      attempt: s.attempt,
      error: s.error,
      detail: s.detail,
      runAt: s.runAt?.toISOString() ?? null,
      completedAt: s.completedAt?.toISOString() ?? null,
    }));
  }

  private async loadVersions(tenantId: string, wf: Workflow) {
    const published = wf.currentVersionId
      ? await this.ds.getRepository(WorkflowVersion).findOne({ where: { id: wf.currentVersionId, tenantId } })
      : null;
    const draft = await this.getDraftVersion(tenantId, wf);
    return { draft, published };
  }

  private async getDraftVersion(tenantId: string, wf: Workflow): Promise<WorkflowVersion | null> {
    const versions = await this.ds.getRepository(WorkflowVersion).find({
      where: { workflowId: wf.id, tenantId },
      order: { version: 'DESC' },
    });
    if (versions.length === 0) return null;
    if (!wf.currentVersionId) return versions[0]!;
    const draft = versions.find((v) => v.id !== wf.currentVersionId);
    return draft ?? null;
  }

  private async syncTriggersAndActions(tenantId: string, workflowId: string, version: WorkflowVersion): Promise<void> {
    await this.ds.getRepository(WorkflowTrigger).delete({ tenantId, workflowId });
    await this.ds.getRepository(WorkflowAction).delete({ tenantId, workflowId });

    const def = compileStepsToGraph(version.definition);
    await this.ds.getRepository(WorkflowTrigger).save(
      this.ds.getRepository(WorkflowTrigger).create({
        tenantId,
        workflowId,
        workflowVersionId: version.id,
        triggerType: def.trigger.type,
        triggerConfig: def.trigger.config ?? {},
      }),
    );

    for (const { nodeId, actionType } of extractActionNodes(version.definition)) {
      await this.ds.getRepository(WorkflowAction).save(
        this.ds.getRepository(WorkflowAction).create({
          tenantId,
          workflowId,
          workflowVersionId: version.id,
          actionType,
          positionInGraph: nodeId,
        }),
      );
    }
  }
}
