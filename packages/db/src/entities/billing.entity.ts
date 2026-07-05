import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';
export type PaymentLinkStatus = 'pending' | 'paid' | 'expired';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmountCents: number;
}

@Entity('tenant_stripe_settings')
export class TenantStripeSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'tenant_id', unique: true })
  tenantId!: string;

  /** Stripe Connect account id when using Connect (Phase 18 agency rebilling). */
  @Column({ type: 'varchar', name: 'stripe_account_id', length: 80, nullable: true })
  stripeAccountId!: string | null;

  /** Optional tenant-scoped secret key (encrypted). Platform key used when null. */
  @Column({ type: 'text', name: 'encrypted_api_key', nullable: true })
  encryptedApiKey!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('invoices')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'contactId'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'uuid', name: 'contact_id' })
  contactId!: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: InvoiceStatus;

  @Column({ type: 'jsonb', name: 'line_items', default: '[]' })
  lineItems!: InvoiceLineItem[];

  @Column({ type: 'bigint', name: 'total_cents' })
  totalCents!: string;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  @Column({ type: 'varchar', name: 'stripe_payment_link_id', length: 80, nullable: true })
  stripePaymentLinkId!: string | null;

  @Column({ type: 'varchar', name: 'payment_url', length: 512, nullable: true })
  paymentUrl!: string | null;

  @Column({ type: 'date', name: 'due_date', nullable: true })
  dueDate!: string | null;

  @Column({ type: 'timestamptz', name: 'paid_at', nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('payment_links')
@Index(['tenantId', 'createdAt'])
export class PaymentLink {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'uuid', name: 'contact_id', nullable: true })
  contactId!: string | null;

  @Column({ type: 'bigint', name: 'amount_cents' })
  amountCents!: string;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', name: 'stripe_payment_link_id', length: 80 })
  stripePaymentLinkId!: string;

  @Column({ type: 'varchar', name: 'payment_url', length: 512 })
  paymentUrl!: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: PaymentLinkStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
