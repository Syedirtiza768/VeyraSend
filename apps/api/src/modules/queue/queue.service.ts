import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { DataSource } from 'typeorm';
import { Message } from '@veyrasend/db';
import { SendGridClient, SendGridError, type MailSendRequest } from '@veyrasend/sendgrid';
import { ConfigService } from '../../config/config.service';
import { InjectDataSource } from '../../common/db.module';
import { SendgridService } from '../sendgrid/sendgrid.service';

export const MAIL_QUEUE = 'mail';

export interface MailJobData {
  tenantId: string;
  messageId: string;
  idempotencyKey: string;
  spec: {
    fromEmail: string;
    fromName?: string;
    toEmail: string;
    subject: string;
    html?: string;
    text?: string;
    templateId?: string;
    dynamicTemplateData?: Record<string, unknown>;
    unsubscribeGroupId?: number;
    sendAt?: string;
  };
}

/**
 * BullMQ-backed transactional outbox. The HTTP request enqueues a durable job
 * and returns immediately; the worker performs the SendGrid call with retryable
 * backoff. A message row is the durable ledger — its status is the source of
 * truth, reconciled against event webhooks (Phase 9).
 */
@Injectable()
export class QueueService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger('QueueService');
  private readonly queue: Queue<MailJobData>;
  private worker?: Worker<MailJobData>;
  private readonly connectionOpts = {
    url: this.config.all.redisUrl,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };

  constructor(
    private readonly config: ConfigService,
    @InjectDataSource() private readonly ds: DataSource,
    private readonly client: SendGridClient,
    private readonly sendgrid: SendgridService,
  ) {
    this.queue = new Queue<MailJobData>(MAIL_QUEUE, { connection: this.connectionOpts });
  }

  add(data: MailJobData): Promise<unknown> {
    return this.queue.add('send', data, {
      attempts: 6,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 2000 },
    });
  }

  onApplicationBootstrap(): void {
    this.worker = new Worker<MailJobData>(
      MAIL_QUEUE,
      async (job) => this.process(job.data),
      { connection: { ...this.connectionOpts }, concurrency: 8 },
    );
    this.worker.on('failed', (job, err) => {
      this.logger.error(`mail job ${job?.id ?? '?'} failed: ${err.message}`);
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
    await this.queue.close();
  }

  private async process(data: MailJobData): Promise<void> {
    const repo = this.ds.getRepository(Message);
    const msg = await repo.findOne({ where: { id: data.messageId, tenantId: data.tenantId } });
    if (!msg) return; // deleted; nothing to do
    if (msg.status === 'sent' || msg.status === 'delivered') return; // idempotent guard

    const { apiKey } = await this.sendgrid.getDecryptedApiKey(data.tenantId);
    const req: MailSendRequest = {
      subuserApiKey: apiKey,
      from: { email: data.spec.fromEmail, name: data.spec.fromName },
      subject: data.spec.subject,
      html: data.spec.html,
      text: data.spec.text,
      templateId: data.spec.templateId,
      dynamicTemplateData: data.spec.dynamicTemplateData,
      personalizations: [{ to: data.spec.toEmail, variables: data.spec.dynamicTemplateData }],
      idempotencyKey: data.idempotencyKey,
      unsubscribeGroupId: data.spec.unsubscribeGroupId,
      sendAt: data.spec.sendAt ? new Date(data.spec.sendAt) : undefined,
    };

    try {
      const res = await this.client.sendMail(req);
      await repo.update({ id: msg.id }, { status: 'sent', sgMessageId: res.messageId, reason: null });
    } catch (err) {
      if (err instanceof SendGridError) {
        if (err.retryable) {
          await repo.update({ id: msg.id }, { reason: err.message });
          throw err; // let BullMQ retry
        }
        await repo.update({ id: msg.id }, { status: 'failed', reason: err.message });
        return;
      }
      throw err;
    }
  }
}
