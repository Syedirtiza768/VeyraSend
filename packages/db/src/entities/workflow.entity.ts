import {
  Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type WorkflowStatus = 'draft' | 'published' | 'paused' | 'archived';
export type WorkflowRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';
export type WorkflowRunStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowTriggerConfig {
  type: string;
  config?: Record<string, unknown>;
}

export interface WorkflowStepDefinition {
  type: 'send_email' | 'delay' | 'condition' | 'send_sms' | 'add_tag' | 'remove_tag' | 'create_task' | 'stop';
  templateId?: string;
  fromEmail?: string;
  fromName?: string;
  durationSeconds?: number;
  body?: string;
  fromNumberId?: string;
  tagId?: string;
  title?: string;
  field?: string;
  op?: 'eq' | 'ne' | 'contains';
  value?: string;
  thenStep?: number;
  elseStep?: number;
}

export interface WorkflowActionNode {
  type: 'action';
  action: string;
  config: Record<string, unknown>;
  next: string;
}

export interface WorkflowDelayNode {
  type: 'delay';
  durationSeconds: number;
  next: string;
}

export interface WorkflowConditionNode {
  type: 'condition';
  field: string;
  op: 'eq' | 'ne' | 'contains';
  value: string;
  ifTrue: string;
  ifFalse: string;
}

export interface WorkflowEndNode {
  type: 'end';
}

export type WorkflowNode = WorkflowActionNode | WorkflowDelayNode | WorkflowConditionNode | WorkflowEndNode;

export interface WorkflowDefinition {
  trigger: WorkflowTriggerConfig;
  steps?: WorkflowStepDefinition[];
  nodes?: Record<string, WorkflowNode>;
  entry?: string;
}

@Entity('workflows')
@Index(['tenantId', 'createdAt'])
export class Workflow {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;
  @Column({ type: 'varchar', length: 120 }) name!: string;
  @Column({ type: 'varchar', length: 20, default: 'draft' }) status!: WorkflowStatus;
  @Column({ type: 'uuid', name: 'current_version_id', nullable: true }) currentVersionId!: string | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' }) deletedAt!: Date | null;
}

@Entity('workflow_versions')
@Index(['workflowId', 'version'], { unique: true })
export class WorkflowVersion {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;
  @Column({ type: 'uuid', name: 'workflow_id' }) workflowId!: string;
  @Column({ type: 'int' }) version!: number;
  @Column({ type: 'jsonb' }) definition!: WorkflowDefinition;
  @Column({ type: 'uuid', name: 'created_by_user_id', nullable: true }) createdByUserId!: string | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}

@Entity('workflow_triggers')
@Index(['tenantId', 'triggerType'])
export class WorkflowTrigger {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'uuid', name: 'workflow_id' }) workflowId!: string;
  @Column({ type: 'uuid', name: 'workflow_version_id' }) workflowVersionId!: string;
  @Column({ type: 'varchar', name: 'trigger_type', length: 80 }) triggerType!: string;
  @Column({ type: 'jsonb', name: 'trigger_config', nullable: true }) triggerConfig!: Record<string, unknown> | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}

@Entity('workflow_actions')
export class WorkflowAction {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'uuid', name: 'workflow_id' }) workflowId!: string;
  @Column({ type: 'uuid', name: 'workflow_version_id' }) workflowVersionId!: string;
  @Column({ type: 'varchar', name: 'action_type', length: 80 }) actionType!: string;
  @Column({ type: 'varchar', name: 'position_in_graph', length: 80 }) positionInGraph!: string;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}

@Entity('workflow_runs')
@Index(['tenantId', 'workflowId', 'status'])
@Index(['tenantId', 'contactId'])
export class WorkflowRun {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'uuid', name: 'workflow_id' }) workflowId!: string;
  @Column({ type: 'uuid', name: 'workflow_version_id' }) workflowVersionId!: string;
  @Column({ type: 'uuid', name: 'contact_id', nullable: true }) contactId!: string | null;
  @Column({ type: 'jsonb', name: 'trigger_payload' }) triggerPayload!: Record<string, unknown>;
  @Column({ type: 'varchar', length: 20, default: 'running' }) status!: WorkflowRunStatus;
  @Column({ type: 'boolean', name: 'dry_run', default: false }) dryRun!: boolean;
  @Column({ type: 'timestamptz', name: 'started_at', default: () => 'now()' }) startedAt!: Date;
  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true }) completedAt!: Date | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}

@Entity('workflow_run_steps')
@Index(['tenantId', 'workflowRunId', 'nodeId'], { unique: true })
@Index(['status', 'runAt'])
export class WorkflowRunStep {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'uuid', name: 'workflow_run_id' }) workflowRunId!: string;
  @Column({ type: 'varchar', name: 'node_id', length: 80 }) nodeId!: string;
  @Column({ type: 'varchar', length: 20, default: 'pending' }) status!: WorkflowRunStepStatus;
  @Column({ type: 'int', default: 1 }) attempt!: number;
  @Column({ type: 'text', nullable: true }) error!: string | null;
  @Column({ type: 'jsonb', nullable: true }) detail!: Record<string, unknown> | null;
  @Column({ type: 'timestamptz', name: 'run_at', nullable: true }) runAt!: Date | null;
  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true }) completedAt!: Date | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}
