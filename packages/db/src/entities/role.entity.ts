import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export const SYSTEM_ROLES = ['owner', 'admin', 'member'] as const;

/** Permission strings used across the app. */
export const PERMISSIONS = [
  'users:read',
  'users:write',
  'users:delete',
  'tenants:read',
  'tenants:write',
  'audit:read',
  'sendgrid:provision',
  'senders:read',
  'senders:write',
  'domains:read',
  'domains:write',
  // Phase 3 — transactional send + events
  'messages:read',
  'messages:write',
  'events:read',
  // Phase 4 — contacts / lists / segments / suppressions
  'contacts:read',
  'contacts:write',
  'contacts:delete',
  'lists:read',
  'lists:write',
  'lists:delete',
  'segments:read',
  'segments:write',
  'segments:delete',
  'suppressions:read',
  'suppressions:write',
  // Phase 5 — templates
  'templates:read',
  'templates:write',
  'templates:delete',
  // Phase 6 — campaigns
  'campaigns:read',
  'campaigns:write',
  'campaigns:delete',
  // Phase 7 — inbound / inbox
  'inbound:read',
  // Phase 8 — automations
  'automations:read',
  'automations:write',
  'automations:delete',
  // Phase 9 — analytics
  'analytics:read',
  // Phase 10 — settings / usage / admin
  'settings:read',
  'settings:write',
  'usage:read',
  // Phase 12 — CRM core
  'companies:read',
  'companies:write',
  'companies:delete',
  'pipelines:read',
  'pipelines:write',
  'pipelines:delete',
  'deals:read',
  'deals:write',
  'deals:delete',
  'tasks:read',
  'tasks:write',
  'tasks:delete',
  'notes:read',
  'notes:write',
  'notes:delete',
  'tags:read',
  'tags:write',
  'tags:delete',
  'custom-fields:read',
  'custom-fields:write',
  'custom-fields:delete',
  // Phase 13 — Twilio SMS/voice
  'twilio:provision',
  'phone-numbers:read',
  'phone-numbers:write',
  'phone-numbers:delete',
  'calls:read',
  'calls:write',
  // Phase 14 — unified conversations
  'conversations:read',
  'conversations:write',
  // Phase 15 — workflow engine
  'workflows:read',
  'workflows:write',
  'workflows:publish',
  // Phase 16 — calendar, forms, funnels, reputation
  'calendar:read',
  'calendar:write',
  'appointments:read',
  'appointments:write',
  'forms:read',
  'forms:write',
  'forms:delete',
  'funnels:read',
  'funnels:write',
  'funnels:delete',
  'reputation:read',
  'reputation:write',
  // Phase 17 — Stripe billing
  'billing:read',
  'billing:write',
  // Phase 18 — agency layer
  'agency:sub-accounts:read',
  'agency:sub-accounts:write',
  'agency:act-as',
  'agency:branding:read',
  'agency:branding:write',
  'agency:billing-plans:read',
  'agency:feature-flags:read',
  'agency:feature-flags:write',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Tenant-scoped role. `permissions` is a text array of permission strings.
 * System roles (owner/admin/member) are seeded per tenant and cannot be
 * deleted through the UI.
 */
@Entity('roles')
@Index(['tenantId', 'name'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 60 })
  name!: string;

  @Column({ type: 'boolean', name: 'is_system', default: false })
  isSystem!: boolean;

  @Column({ type: 'text', array: true, default: '{}' })
  permissions!: string[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
