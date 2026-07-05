import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown, Inject, forwardRef } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { DataSource } from 'typeorm';
import { WorkflowRun } from '@veyrasend/db';
import { ConfigService } from '../../config/config.service';
import { InjectDataSource } from '../../common/db.module';
import { WorkflowEngineService } from './workflow-engine.service';
import type { RunContext } from './workflow-definition';

export const WORKFLOW_RUN_QUEUE = 'workflow-run';

export interface WorkflowRunJobData {
  tenantId: string;
  runId: string;
  versionId: string;
  nodeId: string;
  attempt: number;
}

@Injectable()
export class WorkflowQueueService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger('WorkflowQueueService');
  private readonly queue: Queue<WorkflowRunJobData>;
  private worker?: Worker<WorkflowRunJobData>;
  private readonly connectionOpts = {
    url: this.config.all.redisUrl,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };

  constructor(
    private readonly config: ConfigService,
    @InjectDataSource() private readonly ds: DataSource,
    @Inject(forwardRef(() => WorkflowEngineService)) private readonly engine: WorkflowEngineService,
  ) {
    this.queue = new Queue<WorkflowRunJobData>(WORKFLOW_RUN_QUEUE, { connection: this.connectionOpts });
  }

  enqueue(data: WorkflowRunJobData, delayMs = 0): Promise<unknown> {
    const jobId = `${data.runId}:${data.nodeId}:${data.attempt}`;
    return this.queue.add('step', data, {
      jobId,
      delay: delayMs,
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 2000 },
    });
  }

  onApplicationBootstrap(): void {
    this.worker = new Worker<WorkflowRunJobData>(
      WORKFLOW_RUN_QUEUE,
      async (job) => this.process(job.data),
      { connection: { ...this.connectionOpts }, concurrency: 4 },
    );
    this.worker.on('failed', (job, err) => {
      this.logger.error(`workflow-run job ${job?.id ?? '?'} failed: ${err.message}`);
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
    await this.queue.close();
  }

  private async process(data: WorkflowRunJobData): Promise<void> {
    await this.ds.query(`SELECT set_config('app.tenant_id', $1, true)`, [data.tenantId]);

    const run = await this.ds.getRepository(WorkflowRun).findOne({
      where: { id: data.runId, tenantId: data.tenantId },
    });
    if (!run || run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') return;

    const tenantId = run.tenantId;

    const existing = await this.engine.getCompletedStep(tenantId, data.runId, data.nodeId);
    if (existing) return;

    const ctx: RunContext = {
      tenantId,
      workflowRunId: data.runId,
      contactId: run.contactId,
      dryRun: run.dryRun,
      triggerPayload: run.triggerPayload ?? {},
    };

    await this.engine.upsertStep(tenantId, data.runId, data.nodeId, {
      status: 'running',
      attempt: data.attempt,
    });

    try {
      const result = await this.engine.executeNode(ctx, data.versionId, data.nodeId);

      if (result.delayMs && result.delayMs > 0 && result.nextNodeId) {
        const runAt = new Date(Date.now() + result.delayMs);
        await this.engine.upsertStep(tenantId, data.runId, data.nodeId, {
          status: 'completed',
          completedAt: new Date(),
          detail: { ...result.detail, delayMs: result.delayMs, nextNodeId: result.nextNodeId },
          runAt,
        });
        await this.enqueue({
          tenantId: data.tenantId,
          runId: data.runId,
          versionId: data.versionId,
          nodeId: result.nextNodeId,
          attempt: 1,
        }, result.delayMs);
        return;
      }

      await this.engine.upsertStep(tenantId, data.runId, data.nodeId, {
        status: 'completed',
        completedAt: new Date(),
        detail: result.detail ?? null,
      });

      if (!result.nextNodeId) {
        await this.engine.markRunCompleted(data.runId, tenantId);
        return;
      }

      await this.enqueue({
        tenantId: data.tenantId,
        runId: data.runId,
        versionId: data.versionId,
        nodeId: result.nextNodeId,
        attempt: 1,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.engine.upsertStep(tenantId, data.runId, data.nodeId, {
        status: 'failed',
        error: message,
        completedAt: new Date(),
      });
      await this.engine.markRunFailed(data.runId, tenantId, message);
      throw err;
    }
  }
}
