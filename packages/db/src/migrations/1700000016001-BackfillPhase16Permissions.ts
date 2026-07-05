import { MigrationInterface, QueryRunner } from 'typeorm';

const PHASE16_PERMS = [
  'calendar:read', 'calendar:write',
  'appointments:read', 'appointments:write',
  'forms:read', 'forms:write', 'forms:delete',
  'funnels:read', 'funnels:write', 'funnels:delete',
  'reputation:read', 'reputation:write',
];

function pgArray(values: string[]): string {
  return `ARRAY[${values.map((v) => `'${v}'`).join(', ')}]::text[]`;
}

export class BackfillPhase16Permissions1700000016001 implements MigrationInterface {
  name = 'BackfillPhase16Permissions1700000016001';

  async up(q: QueryRunner): Promise<void> {
    for (const role of ['owner', 'admin']) {
      const rows = await q.query(`SELECT permissions FROM roles WHERE is_system = true AND name = '${role}' LIMIT 1`);
      if (!rows[0]) continue;
      const perms = [...new Set([...(rows[0].permissions ?? []), ...PHASE16_PERMS])];
      await q.query(`UPDATE roles SET permissions = ${pgArray(perms)} WHERE is_system = true AND name = '${role}'`);
    }
    const memberRows = await q.query(`SELECT permissions FROM roles WHERE is_system = true AND name = 'member' LIMIT 1`);
    if (memberRows[0]) {
      const readPerms = ['calendar:read', 'appointments:read', 'forms:read', 'funnels:read', 'reputation:read'];
      const perms = [...new Set([...(memberRows[0].permissions ?? []), ...readPerms])];
      await q.query(`UPDATE roles SET permissions = ${pgArray(perms)} WHERE is_system = true AND name = 'member'`);
    }
  }

  async down(): Promise<void> {}
}
