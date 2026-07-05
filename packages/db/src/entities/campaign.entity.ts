import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'failed';

@Entity('campaigns')
@Index(['tenantId', 'createdAt'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  @Column({ type: 'varchar', length: 120 }) name!: string;

  @Column({ type: 'uuid', name: 'template_id' }) templateId!: string;

  @Column({ type: 'uuid', name: 'segment_id' }) segmentId!: string;

  @Column({ type: 'varchar', length: 255, name: 'from_email' }) fromEmail!: string;

  @Column({ type: 'varchar', length: 120, name: 'from_name', nullable: true }) fromName!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true }) subject!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'draft' }) status!: CampaignStatus;

  @Column({ type: 'timestamptz', name: 'scheduled_at', nullable: true }) scheduledAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'started_at', nullable: true }) startedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true }) completedAt!: Date | null;

  @Column({ type: 'int', default: 0 }) recipients!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' }) deletedAt!: Date | null;
}
