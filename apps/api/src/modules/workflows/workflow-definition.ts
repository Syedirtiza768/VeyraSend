import { BadRequestException } from '@nestjs/common';
import type { WorkflowDefinition, WorkflowNode, WorkflowStepDefinition } from '@veyrasend/db';

export const WORKFLOW_TRIGGER_TYPES = [
  'contact.created',
  'tag.added',
  'pipeline_stage.changed',
  'email.opened',
  'email.clicked',
  'sms.received',
  'call.missed',
  'manual',
  'appointment.booked',
  'form.submitted',
  'invoice.paid',
] as const;

export type WorkflowTriggerType = (typeof WORKFLOW_TRIGGER_TYPES)[number];

export interface RunContext {
  tenantId: string;
  workflowRunId: string;
  contactId: string | null;
  dryRun: boolean;
  triggerPayload: Record<string, unknown>;
}

/** Compile step-list builder format into executable node graph. */
export function compileStepsToGraph(def: WorkflowDefinition): WorkflowDefinition {
  if (def.nodes && def.entry) return def;
  const steps = def.steps ?? [];
  if (steps.length === 0) {
    return {
      ...def,
      nodes: { start: { type: 'end' }, end: { type: 'end' } },
      entry: 'start',
    };
  }

  const nodes: Record<string, WorkflowNode> = {};
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const nodeId = `step-${i}`;
    const defaultNext = i + 1 < steps.length ? `step-${i + 1}` : 'end';

    if (step.type === 'send_email') {
      nodes[nodeId] = {
        type: 'action',
        action: 'send_email',
        config: { templateId: step.templateId, fromEmail: step.fromEmail, fromName: step.fromName },
        next: defaultNext,
      };
    } else if (step.type === 'send_sms') {
      nodes[nodeId] = {
        type: 'action',
        action: 'send_sms',
        config: { body: step.body, fromNumberId: step.fromNumberId },
        next: defaultNext,
      };
    } else if (step.type === 'delay') {
      nodes[nodeId] = {
        type: 'delay',
        durationSeconds: step.durationSeconds ?? 1,
        next: defaultNext,
      };
    } else if (step.type === 'condition') {
      const thenId = step.thenStep !== undefined ? `step-${step.thenStep}` : defaultNext;
      const elseId = step.elseStep !== undefined ? `step-${step.elseStep}` : defaultNext;
      nodes[nodeId] = {
        type: 'condition',
        field: step.field ?? 'email',
        op: step.op ?? 'eq',
        value: String(step.value ?? ''),
        ifTrue: thenId,
        ifFalse: elseId,
      };
    } else if (step.type === 'add_tag') {
      nodes[nodeId] = {
        type: 'action',
        action: 'add_tag',
        config: { tagId: step.tagId },
        next: defaultNext,
      };
    } else if (step.type === 'remove_tag') {
      nodes[nodeId] = {
        type: 'action',
        action: 'remove_tag',
        config: { tagId: step.tagId },
        next: defaultNext,
      };
    } else if (step.type === 'create_task') {
      nodes[nodeId] = {
        type: 'action',
        action: 'create_task',
        config: { title: step.title },
        next: defaultNext,
      };
    } else if (step.type === 'stop') {
      nodes[nodeId] = { type: 'end' };
    } else {
      throw new BadRequestException(`Unknown step type: ${(step as WorkflowStepDefinition).type}`);
    }
  }
  nodes.end = { type: 'end' };
  return { ...def, nodes, entry: 'step-0' };
}

export function validateWorkflowDefinition(def: WorkflowDefinition): void {
  if (!def?.trigger?.type) throw new BadRequestException('trigger.type is required');
  if (!WORKFLOW_TRIGGER_TYPES.includes(def.trigger.type as WorkflowTriggerType)) {
    throw new BadRequestException(`Unsupported trigger type: ${def.trigger.type}`);
  }
  const compiled = compileStepsToGraph(def);
  if (!compiled.nodes || !compiled.entry) throw new BadRequestException('Invalid workflow definition');
  const nodes = compiled.nodes;
  if (!nodes[compiled.entry]) throw new BadRequestException('Entry node missing');

  for (const step of def.steps ?? []) {
    if (step.type === 'send_email' && (!step.templateId || !step.fromEmail)) {
      throw new BadRequestException('send_email step requires templateId and fromEmail');
    }
    if (step.type === 'delay' && typeof step.durationSeconds !== 'number') {
      throw new BadRequestException('delay step requires durationSeconds');
    }
    if (step.type === 'condition' && (step.field === undefined || step.thenStep === undefined || step.elseStep === undefined)) {
      throw new BadRequestException('condition step requires field, thenStep, elseStep');
    }
    if (step.type === 'send_sms' && !step.body) {
      throw new BadRequestException('send_sms step requires body');
    }
    if ((step.type === 'add_tag' || step.type === 'remove_tag') && !step.tagId) {
      throw new BadRequestException(`${step.type} step requires tagId`);
    }
    if (step.type === 'create_task' && !step.title) {
      throw new BadRequestException('create_task step requires title');
    }
  }
}

export function extractActionNodes(def: WorkflowDefinition): Array<{ nodeId: string; actionType: string }> {
  const compiled = compileStepsToGraph(def);
  const out: Array<{ nodeId: string; actionType: string }> = [];
  for (const [nodeId, node] of Object.entries(compiled.nodes ?? {})) {
    if (node.type === 'action') out.push({ nodeId, actionType: node.action });
  }
  return out;
}

export function matchesTriggerConfig(
  triggerConfig: Record<string, unknown> | null,
  payload: Record<string, unknown>,
): boolean {
  if (!triggerConfig || Object.keys(triggerConfig).length === 0) return true;
  for (const [key, expected] of Object.entries(triggerConfig)) {
    if (payload[key] !== expected) return false;
  }
  return true;
}
