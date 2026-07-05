import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export interface LandingPageSection {
  type: 'hero' | 'form_embed' | 'testimonial' | 'feature_grid' | 'cta' | 'text_block' | 'image';
  config: Record<string, unknown>;
}

@Entity('landing_pages')
@Index(['tenantId'])
export class LandingPage {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'varchar', length: 120 }) name!: string;
  @Column({ type: 'varchar', length: 80, unique: true }) slug!: string;
  @Column({ type: 'jsonb', default: '[]' }) content!: LandingPageSection[];
  @Column({ type: 'boolean', default: false }) published!: boolean;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}

@Entity('funnels')
@Index(['tenantId'])
export class Funnel {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'varchar', length: 120 }) name!: string;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}

@Entity('funnel_steps')
@Index(['tenantId', 'funnelId', 'position'])
export class FunnelStep {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'uuid', name: 'funnel_id' }) funnelId!: string;
  @Column({ type: 'uuid', name: 'landing_page_id' }) landingPageId!: string;
  @Column({ type: 'int' }) position!: number;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}
