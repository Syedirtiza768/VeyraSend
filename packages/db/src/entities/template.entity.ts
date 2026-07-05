import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type TemplateGeneration = 'dynamic' | 'legacy';

export interface TemplateVariable {
  key: string;
  type?: 'text' | 'number' | 'date' | 'boolean';
  fallback?: string;
}

@Entity('templates')
@Index(['tenantId', 'name'], { unique: true })
export class Template {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' }) @Index() tenantId!: string;

  @Column({ type: 'varchar', length: 120 }) name!: string;

  @Column({ type: 'varchar', length: 255 }) subject!: string;

  @Column({ type: 'text' }) html!: string;

  @Column({ type: 'text', nullable: true }) text!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'dynamic' }) generation!: TemplateGeneration;

  @Column({ type: 'jsonb' }) variables!: TemplateVariable[];

  @Column({ type: 'int', default: 1 }) version!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' }) deletedAt!: Date | null;
}
