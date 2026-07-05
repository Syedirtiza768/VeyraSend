import {
  Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type FormFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date';

@Entity('forms')
@Index(['tenantId', 'createdAt'])
export class Form {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'varchar', length: 120 }) name!: string;
  @Column({ type: 'varchar', name: 'spam_protection', length: 20, default: 'honeypot' }) spamProtection!: string;
  @Column({ type: 'varchar', name: 'redirect_url', length: 500, nullable: true }) redirectUrl!: string | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' }) updatedAt!: Date;
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' }) deletedAt!: Date | null;
}

@Entity('form_fields')
@Index(['tenantId', 'formId', 'position'])
export class FormField {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'uuid', name: 'form_id' }) formId!: string;
  @Column({ type: 'varchar', length: 120 }) label!: string;
  @Column({ type: 'varchar', name: 'field_key', length: 80 }) fieldKey!: string;
  @Column({ type: 'varchar', name: 'field_type', length: 20 }) fieldType!: FormFieldType;
  @Column({ type: 'boolean', default: false }) required!: boolean;
  @Column({ type: 'int' }) position!: number;
  @Column({ type: 'jsonb', nullable: true }) options!: string[] | null;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}

@Entity('form_submissions')
@Index(['tenantId', 'formId', 'createdAt'])
export class FormSubmission {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', name: 'tenant_id' }) tenantId!: string;
  @Column({ type: 'uuid', name: 'form_id' }) formId!: string;
  @Column({ type: 'uuid', name: 'contact_id', nullable: true }) contactId!: string | null;
  @Column({ type: 'jsonb' }) data!: Record<string, unknown>;
  @Column({ type: 'jsonb', nullable: true }) utm!: Record<string, unknown> | null;
  @Column({ type: 'varchar', name: 'ip_address', length: 45, nullable: true }) ipAddress!: string | null;
  @Column({ type: 'boolean', name: 'is_spam', default: false }) isSpam!: boolean;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}
