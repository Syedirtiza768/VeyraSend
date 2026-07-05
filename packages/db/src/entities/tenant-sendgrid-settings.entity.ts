import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * One row per tenant: the SendGrid subuser that isolates this tenant's sending
 * (ADR-0001). The subuser API key is encrypted at rest; never select it into
 * responses or logs.
 */
@Entity('tenant_sendgrid_settings')
export class TenantSendgridSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'tenant_id', unique: true })
  tenantId!: string;

  @Column({ type: 'varchar', length: 120, name: 'subuser_username' })
  subuserUsername!: string;

  @Column({ type: 'varchar', length: 255, name: 'subuser_id' })
  subuserId!: string;

  /** AES-256-GCM ciphertext (base64) of the subuser API key. */
  @Column({ type: 'text', name: 'encrypted_api_key' })
  encryptedApiKey!: string;

  @Column({ type: 'varchar', length: 60, name: 'api_key_id', nullable: true })
  apiKeyId!: string | null;

  @Column({ type: 'varchar', length: 40, default: 'mock' })
  region!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
