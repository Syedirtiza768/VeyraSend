import { MigrationInterface, QueryRunner } from 'typeorm';

const TWILIO_PERMS = [
  'phone-numbers:read', 'phone-numbers:write', 'phone-numbers:delete',
  'calls:read', 'calls:write',
  'twilio:provision',
];

function pgArray(values: string[]): string {
  return `ARRAY[${values.map((v) => `'${v}'`).join(', ')}]::text[]`;
}

export class BackfillTwilioRolePermissions1700000013001 implements MigrationInterface {
  name = 'BackfillTwilioRolePermissions1700000013001';

  async up(q: QueryRunner): Promise<void> {
    for (const role of ['owner', 'admin']) {
      const rows = await q.query(`SELECT permissions FROM roles WHERE is_system = true AND name = '${role}' LIMIT 1`);
      if (!rows[0]) continue;
      const perms = [...new Set([...(rows[0].permissions ?? []), ...TWILIO_PERMS])];
      await q.query(`UPDATE roles SET permissions = ${pgArray(perms)} WHERE is_system = true AND name = '${role}'`);
    }
    const memberRows = await q.query(`SELECT permissions FROM roles WHERE is_system = true AND name = 'member' LIMIT 1`);
    if (memberRows[0]) {
      const perms = [...new Set([...(memberRows[0].permissions ?? []), 'phone-numbers:read', 'calls:read'])];
      await q.query(`UPDATE roles SET permissions = ${pgArray(perms)} WHERE is_system = true AND name = 'member'`);
    }
  }

  async down(): Promise<void> {}
}
