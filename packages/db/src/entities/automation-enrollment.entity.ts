import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type EnrollmentState = 'active' | 'completed' | 'exited';

@Entity('automation_enrollments')
@Index(['tenantId', 'automationId'])
@Index(['tenantId', 'state'])
export class AutomationEnrollment {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  @Column({ type: 'uuid', name: 'automation_id' }) @Index() automationId!: string;

  @Column({ type: 'uuid', name: 'contact_id' }) @Index() contactId!: string;

  @Column({ type: 'int', name: 'current_step', default: 0 }) currentStep!: number;

  @Column({ type: 'varchar', length: 20, default: 'active' }) state!: EnrollmentState;

  @Column({ type: 'timestamptz', name: 'next_at' }) nextAt!: Date;

  @Column({ type: 'timestamptz', name: 'enrolled_at' }) enrolledAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}
