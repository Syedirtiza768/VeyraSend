import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type DealStatus = 'open' | 'won' | 'lost';

@Entity('deals')
@Index(['tenantId', 'pipelineId', 'stageId'])
@Index(['tenantId', 'contactId'])
@Index(['tenantId', 'ownerUserId'])
export class Deal {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;
  @Column({ type: 'uuid', name: 'pipeline_id' }) pipelineId!: string;
  @Column({ type: 'uuid', name: 'stage_id' }) stageId!: string;
  @Column({ type: 'uuid', name: 'contact_id', nullable: true }) contactId!: string | null;
  @Column({ type: 'uuid', name: 'company_id', nullable: true }) companyId!: string | null;
  @Column({ type: 'varchar', length: 255 }) name!: string;
  @Column({ type: 'bigint', name: 'value_cents', nullable: true }) valueCents!: string | null;
  @Column({ type: 'varchar', length: 3, default: 'USD' }) currency!: string;
  @Column({ type: 'uuid', name: 'owner_user_id', nullable: true }) ownerUserId!: string | null;
  @Column({ type: 'varchar', length: 20, default: 'open' }) status!: DealStatus;
  @Column({ type: 'date', name: 'expected_close_date', nullable: true }) expectedCloseDate!: string | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' }) deletedAt!: Date | null;
}
