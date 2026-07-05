import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('pipeline_stages')
@Index(['tenantId', 'pipelineId', 'position'])
export class PipelineStage {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;
  @Column({ type: 'uuid', name: 'pipeline_id' }) pipelineId!: string;
  @Column({ type: 'varchar', length: 120 }) name!: string;
  @Column({ type: 'int' }) position!: number;
  @Column({ type: 'int', nullable: true }) probability!: number | null;
  @Column({ type: 'boolean', name: 'is_won', default: false }) isWon!: boolean;
  @Column({ type: 'boolean', name: 'is_lost', default: false }) isLost!: boolean;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}
