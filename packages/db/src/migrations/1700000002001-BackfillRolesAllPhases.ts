import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills system role permissions for tenants created before Phases 3-10
 * added their permission surface. Owner gets the full set; admin gets the
 * expanded operator set; member gets a read-only starter set. Idempotent.
 */
const OWNER_PERMS = [
  'users:read', 'users:write', 'users:delete', 'tenants:read', 'tenants:write', 'audit:read',
  'sendgrid:provision', 'senders:read', 'senders:write', 'domains:read', 'domains:write',
  'messages:read', 'messages:write', 'events:read',
  'contacts:read', 'contacts:write', 'contacts:delete',
  'lists:read', 'lists:write', 'lists:delete',
  'segments:read', 'segments:write', 'segments:delete',
  'suppressions:read', 'suppressions:write',
  'templates:read', 'templates:write', 'templates:delete',
  'campaigns:read', 'campaigns:write', 'campaigns:delete',
  'automations:read', 'automations:write', 'automations:delete',
  'inbound:read', 'analytics:read', 'settings:read', 'settings:write', 'usage:read',
];
const ADMIN_PERMS = [
  'users:read', 'users:write', 'users:delete', 'tenants:read', 'audit:read',
  'senders:read', 'senders:write', 'domains:read', 'domains:write',
  'messages:read', 'messages:write', 'events:read',
  'contacts:read', 'contacts:write', 'contacts:delete',
  'lists:read', 'lists:write', 'lists:delete',
  'segments:read', 'segments:write', 'segments:delete',
  'suppressions:read', 'suppressions:write',
  'templates:read', 'templates:write', 'templates:delete',
  'campaigns:read', 'campaigns:write', 'campaigns:delete',
  'automations:read', 'automations:write', 'automations:delete',
  'inbound:read', 'analytics:read', 'settings:read', 'settings:write', 'usage:read',
];
const MEMBER_PERMS = ['tenants:read', 'contacts:read', 'lists:read', 'templates:read', 'campaigns:read'];

function pgArray(values: string[]): string {
  return `ARRAY[${values.map((v) => `'${v}'`).join(', ')}]::text[]`;
}

export class BackfillRolesAllPhases1700000002001 implements MigrationInterface {
  name = 'BackfillRolesAllPhases1700000002001';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`UPDATE "roles" SET "permissions" = ${pgArray(OWNER_PERMS)} WHERE "is_system" = true AND "name" = 'owner'`);
    await q.query(`UPDATE "roles" SET "permissions" = ${pgArray(ADMIN_PERMS)} WHERE "is_system" = true AND "name" = 'admin'`);
    await q.query(`UPDATE "roles" SET "permissions" = ${pgArray(MEMBER_PERMS)} WHERE "is_system" = true AND "name" = 'member'`);
  }

  async down(): Promise<void> {
    // No destructive down — permissions are additive.
  }
}
