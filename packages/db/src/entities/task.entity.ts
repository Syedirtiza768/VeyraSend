import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TaskStatus = 'open' | 'done';
export type CrmEntityType = 'contact' | 'deal' | 'company';

@Entity('tasks')
@Index(['tenantId', 'entityType', 'entityId'])
@Index(['tenantId', 'assigneeUserId', 'status'])
export class Task {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;
  @Column({ type: 'varchar', length: 255 }) title!: string;
  @Column({ type: 'text', nullable: true }) description!: string | null;
  @Column({ type: 'timestamptz', name: 'due_at', nullable: true }) dueAt!: Date | null;
  @Column({ type: 'varchar', length: 20, default: 'open' }) status!: TaskStatus;
  @Column({ type: 'uuid', name: 'assignee_user_id', nullable: true }) assigneeUserId!: string | null;
  @Column({ type: 'varchar', name: 'entity_type', length: 20 }) entityType!: CrmEntityType;
  @Column({ type: 'uuid', name: 'entity_id' }) entityId!: string;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' }) deletedAt!: Date | null;
}
