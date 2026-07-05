import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type AutomationStatus = 'active' | 'paused';

export interface AutomationStep {
  type: 'send' | 'delay' | 'branch';
  // send
  templateId?: string;
  fromEmail?: string;
  fromName?: string;
  // delay
  durationMs?: number;
  // branch: jump to step index by condition
  field?: string;
  op?: 'eq' | 'ne' | 'contains';
  value?: string;
  thenStep?: number;
  elseStep?: number;
}

export interface AutomationDefinition {
  trigger: { event: 'contact.created' };
  steps: AutomationStep[];
}

@Entity('automations')
@Index(['tenantId', 'createdAt'])
export class Automation {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  @Column({ type: 'varchar', length: 120 }) name!: string;

  @Column({ type: 'varchar', length: 20, default: 'paused' }) status!: AutomationStatus;

  @Column({ type: 'jsonb' }) definition!: AutomationDefinition;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' }) deletedAt!: Date | null;
}
