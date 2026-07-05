import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { TemplateVariable, TemplateGeneration } from './template.entity';

@Entity('template_versions')
@Index(['tenantId', 'templateId'])
export class TemplateVersion {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;

  @Column({ type: 'uuid', name: 'template_id' }) @Index() templateId!: string;

  @Column({ type: 'int' }) version!: number;

  @Column({ type: 'varchar', length: 255 }) subject!: string;

  @Column({ type: 'text' }) html!: string;

  @Column({ type: 'text', nullable: true }) text!: string | null;

  @Column({ type: 'varchar', length: 20 }) generation!: TemplateGeneration;

  @Column({ type: 'jsonb' }) variables!: TemplateVariable[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}
