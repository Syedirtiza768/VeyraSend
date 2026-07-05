import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  Contact, ContactTag, WorkflowRun, WorkflowRunStep, WorkflowVersion, type WorkflowNode,
} from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { TemplatesService, render } from '../templates/templates.service';
import { SuppressionsService } from '../suppressions/suppressions.service';
import { MessagesService } from '../messages/messages.service';
import { TagsService } from '../tags/tags.service';
import { TasksService } from '../tasks/tasks.service';
import { SmsService } from '../sms/sms.service';
import { compileStepsToGraph, type RunContext } from './workflow-definition';

export interface StepResult {
  nextNodeId: string | null;
  delayMs?: number;
  detail?: Record<string, unknown>;
}

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger('WorkflowEngineService');

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly templates: TemplatesService,
    private readonly suppressions: SuppressionsService,
    private readonly messages: MessagesService,
    @Inject(forwardRef(() => TagsService)) private readonly tags: TagsService,
    private readonly tasks: TasksService,
    @Inject(forwardRef(() => SmsService)) private readonly sms: SmsService,
  ) {}

  async executeNode(
    ctx: RunContext,
    versionId: string,
    nodeId: string,
  ): Promise<StepResult> {
    const version = await this.ds.getRepository(WorkflowVersion).findOne({
      where: { id: versionId, tenantId: ctx.tenantId },
    });
    if (!version) throw new Error('Workflow version not found');
    const def = compileStepsToGraph(version.definition);
    const node = def.nodes?.[nodeId];
    if (!node) throw new Error(`Node ${nodeId} not found`);

    if (node.type === 'end') return { nextNodeId: null };
    if (node.type === 'delay') {
      return { nextNodeId: node.next, delayMs: node.durationSeconds * 1000 };
    }
    if (node.type === 'condition') {
      const contact = await this.loadContact(ctx);
      const matched = contact ? this.evalCondition(node, contact) : false;
      return { nextNodeId: matched ? node.ifTrue : node.ifFalse };
    }
    if (node.type === 'action') {
      const detail = await this.runAction(ctx, node.action, node.config);
      return { nextNodeId: node.next, detail };
    }
    throw new Error(`Unknown node type at ${nodeId}`);
  }

  private async loadContact(ctx: RunContext): Promise<Contact | null> {
    if (!ctx.contactId) return null;
    return this.ds.getRepository(Contact).findOne({
      where: { id: ctx.contactId, tenantId: ctx.tenantId },
    });
  }

  private evalCondition(
    node: Extract<WorkflowNode, { type: 'condition' }>,
    contact: Contact,
  ): boolean {
    let actual = '';
    if (node.field === 'email') actual = contact.email;
    else if (node.field === 'status') actual = contact.status;
    else if (node.field.startsWith('custom:')) {
      const key = node.field.slice('custom:'.length);
      actual = contact.customFields?.[key] === undefined ? '' : String(contact.customFields[key]);
    }
    const a = actual.toLowerCase();
    const v = String(node.value).toLowerCase();
    if (node.op === 'eq') return a === v;
    if (node.op === 'ne') return a !== v;
    if (node.op === 'contains') return a.includes(v);
    return false;
  }

  private async runAction(
    ctx: RunContext,
    action: string,
    config: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const tid = assertTenant(ctx.tenantId);
    const contact = await this.loadContact(ctx);

    if (action === 'send_email') {
      if (!contact) return { skipped: true, reason: 'no_contact' };
      const templateId = String(config.templateId ?? '');
      const fromEmail = String(config.fromEmail ?? '');
      if (!templateId || !fromEmail) return { skipped: true, reason: 'missing_config' };

      if (ctx.dryRun) {
        return { dryRun: true, action: 'send_email', to: contact.email, templateId, fromEmail };
      }

      const suppressed = await this.suppressions.suppressedEmails(tid);
      if (suppressed.has(contact.email) || contact.status !== 'active') {
        return { skipped: true, reason: 'suppressed_or_inactive' };
      }
      const template = await this.templates.getById(tid, templateId);
      const vars: Record<string, unknown> = {
        first_name: contact.firstName ?? '',
        last_name: contact.lastName ?? '',
        email: contact.email,
        ...(contact.customFields ?? {}),
      };
      const subject = render(template.subject, vars, template.variables);
      const html = render(template.html, vars, template.variables);
      const msg = await this.messages.enqueueAutomationMessage(tid, {
        fromEmail,
        fromName: config.fromName ? String(config.fromName) : null,
        toEmail: contact.email,
        subject,
        html,
        templateId: template.id,
        dynamicTemplateData: vars,
      });
      return { messageId: msg.id };
    }

    if (action === 'send_sms') {
      if (!contact?.phone) return { skipped: true, reason: 'no_phone' };
      const body = String(config.body ?? '');
      const fromNumberId = config.fromNumberId ? String(config.fromNumberId) : String(ctx.triggerPayload.fromNumberId ?? '');
      if (ctx.dryRun) {
        return { dryRun: true, action: 'send_sms', to: contact.phone, body, fromNumberId };
      }
      if (!fromNumberId) return { skipped: true, reason: 'missing_from_number' };
      const result = await this.sms.send(tid, { contactId: contact.id, fromNumberId, body });
      return { messageId: result.messageId };
    }

    if (action === 'add_tag') {
      if (!contact || !config.tagId) return { skipped: true, reason: 'missing_config' };
      if (ctx.dryRun) return { dryRun: true, action: 'add_tag', tagId: config.tagId };
      await this.tags.attachToContact(tid, contact.id, [String(config.tagId)]);
      return { tagId: config.tagId };
    }

    if (action === 'remove_tag') {
      if (!contact || !config.tagId) return { skipped: true, reason: 'missing_config' };
      if (ctx.dryRun) return { dryRun: true, action: 'remove_tag', tagId: config.tagId };
      await this.tags.detachFromContact(tid, contact.id, String(config.tagId));
      return { tagId: config.tagId };
    }

    if (action === 'create_task') {
      if (!contact || !config.title) return { skipped: true, reason: 'missing_config' };
      if (ctx.dryRun) return { dryRun: true, action: 'create_task', title: config.title };
      const task = await this.tasks.create(tid, {
        title: String(config.title),
        entityType: 'contact',
        entityId: contact.id,
      });
      return { taskId: task.id };
    }

    if (action === 'stop') return { stopped: true };

    this.logger.warn(`Unknown action ${action} in run ${ctx.workflowRunId}`);
    return { skipped: true, reason: 'unknown_action' };
  }

  async markRunCompleted(runId: string, tenantId: string): Promise<void> {
    await this.ds.getRepository(WorkflowRun).update(
      { id: runId, tenantId },
      { status: 'completed', completedAt: new Date() },
    );
  }

  async markRunFailed(runId: string, tenantId: string, error: string): Promise<void> {
    await this.ds.getRepository(WorkflowRun).update(
      { id: runId, tenantId },
      { status: 'failed', completedAt: new Date() },
    );
    this.logger.error(`Run ${runId} failed: ${error}`);
  }

  async upsertStep(
    tenantId: string,
    runId: string,
    nodeId: string,
    patch: Partial<Pick<WorkflowRunStep, 'status' | 'attempt' | 'error' | 'detail' | 'runAt' | 'completedAt'>>,
  ): Promise<WorkflowRunStep> {
    const repo = this.ds.getRepository(WorkflowRunStep);
    let step = await repo.findOne({ where: { tenantId, workflowRunId: runId, nodeId } });
    if (!step) {
      step = repo.create({ tenantId, workflowRunId: runId, nodeId, status: 'pending', attempt: 1 });
    }
    Object.assign(step, patch);
    return repo.save(step);
  }

  async getCompletedStep(tenantId: string, runId: string, nodeId: string): Promise<WorkflowRunStep | null> {
    return this.ds.getRepository(WorkflowRunStep).findOne({
      where: { tenantId, workflowRunId: runId, nodeId, status: 'completed' as never },
    });
  }

  async contactHasTag(tenantId: string, contactId: string, tagId: string): Promise<boolean> {
    const link = await this.ds.getRepository(ContactTag).findOne({ where: { tenantId, contactId, tagId } });
    return !!link;
  }
}
