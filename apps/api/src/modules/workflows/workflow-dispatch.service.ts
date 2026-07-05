import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Workflow, WorkflowRun, WorkflowTrigger, WorkflowVersion } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { compileStepsToGraph, matchesTriggerConfig } from './workflow-definition';
import { WorkflowQueueService } from './workflow-queue.service';

@Injectable()
export class WorkflowDispatchService {
  private readonly logger = new Logger('WorkflowDispatchService');

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @Inject(forwardRef(() => WorkflowQueueService)) private readonly queue: WorkflowQueueService,
  ) {}

  /** Fire a trigger — enqueues one run per matching published workflow. */
  async dispatch(
    tenantId: string,
    triggerType: string,
    payload: Record<string, unknown>,
    opts?: { dryRun?: boolean; workflowId?: string; versionId?: string },
  ): Promise<string[]> {
    const tid = assertTenant(tenantId);
    const contactId = payload.contactId ? String(payload.contactId) : null;

    if (opts?.workflowId && opts.versionId) {
      const runId = await this.createRun(tid, opts.workflowId, opts.versionId, contactId, payload, !!opts.dryRun);
      await this.startRun(tid, runId, opts.versionId);
      return [runId];
    }

    const triggers = await this.ds.getRepository(WorkflowTrigger).find({
      where: { tenantId: tid, triggerType },
    });
    const runIds: string[] = [];

    for (const trig of triggers) {
      if (!matchesTriggerConfig(trig.triggerConfig, payload)) continue;
      const wf = await this.ds.getRepository(Workflow).findOne({
        where: { id: trig.workflowId, tenantId: tid },
      });
      if (!wf || wf.status !== 'published' || wf.currentVersionId !== trig.workflowVersionId) continue;

      const runId = await this.createRun(tid, wf.id, trig.workflowVersionId, contactId, payload, false);
      await this.startRun(tid, runId, trig.workflowVersionId);
      runIds.push(runId);
    }

    if (runIds.length > 0) {
      this.logger.log(`Dispatched ${runIds.length} run(s) for ${triggerType} tenant=${tid}`);
    }
    return runIds;
  }

  private async createRun(
    tenantId: string,
    workflowId: string,
    versionId: string,
    contactId: string | null,
    payload: Record<string, unknown>,
    dryRun: boolean,
  ): Promise<string> {
    const run = this.ds.getRepository(WorkflowRun).create({
      tenantId,
      workflowId,
      workflowVersionId: versionId,
      contactId,
      triggerPayload: payload,
      status: 'running',
      dryRun,
      startedAt: new Date(),
    });
    await this.ds.getRepository(WorkflowRun).save(run);
    return run.id;
  }

  private async startRun(tenantId: string, runId: string, versionId: string): Promise<void> {
    const version = await this.ds.getRepository(WorkflowVersion).findOne({
      where: { id: versionId, tenantId },
    });
    if (!version) return;
    const def = compileStepsToGraph(version.definition);
    const entry = def.entry ?? 'step-0';
    await this.queue.enqueue({
      tenantId,
      runId,
      versionId,
      nodeId: entry,
      attempt: 1,
    });
  }
}
