import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type ReviewRequestStatus = 'sent' | 'clicked' | 'completed';
export type ReviewChannel = 'email' | 'sms';

@Entity('reputation_settings')
@Index(['tenantId'], { unique: true })
export class ReputationSettings {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'varchar', name: 'google_review_link', length: 500, nullable: true }) googleReviewLink!: string | null;
  @Column({ type: 'jsonb', name: 'widget_testimonials', default: '[]' }) widgetTestimonials!: Array<{ quote: string; name: string }>;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
}

@Entity('review_requests')
@Index(['tenantId', 'contactId'])
export class ReviewRequest {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'uuid', name: 'contact_id' }) contactId!: string;
  @Column({ type: 'varchar', length: 10 }) channel!: ReviewChannel;
  @Column({ type: 'varchar', name: 'review_link', length: 500 }) reviewLink!: string;
  @Column({ type: 'varchar', length: 20, default: 'sent' }) status!: ReviewRequestStatus;
  @Column({ type: 'timestamptz', name: 'sent_at', default: () => 'now()' }) sentAt!: Date;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}
