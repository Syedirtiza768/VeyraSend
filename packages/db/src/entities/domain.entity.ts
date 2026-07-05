import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/** DNS record returned by SendGrid for domain authentication. */
export interface DomainDnsRecord {
  host: string;
  type: 'TXT' | 'CNAME' | 'MX';
  data: string;
  valid?: boolean | null;
}

/**
 * Tenant-scoped authenticated domain (mirrors SendGrid /whitelabel/domains).
 * `dns` stores the records SendGrid returned so the UI can show them without
 * another round-trip.
 */
@Entity('domains')
@Index(['tenantId', 'domain'], { unique: true })
export class Domain {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 255, name: 'domain_id' })
  domainId!: string;

  @Column({ type: 'varchar', length: 255 })
  domain!: string;

  @Column({ type: 'boolean', default: false })
  verified!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  dns!: DomainDnsRecord[] | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
