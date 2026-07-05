import { MigrationInterface, QueryRunner } from 'typeorm';

const WORKFLOW_PERMS = ['workflows:read', 'workflows:write', 'workflows:publish'];

function pgArray(values: string[]): string {
  return `ARRAY[${values.map((v) => `'${v}'`).join(', ')}]::text[]`;
}

/** Backfill workflow permissions and migrate automations → workflows. */
export class BackfillWorkflowPermissionsAndMigrateAutomations1700000015001 implements MigrationInterface {
  name = 'BackfillWorkflowPermissionsAndMigrateAutomations1700000015001';

  async up(q: QueryRunner): Promise<void> {
    for (const role of ['owner', 'admin']) {
      const rows = await q.query(`SELECT permissions FROM roles WHERE is_system = true AND name = '${role}' LIMIT 1`);
      if (!rows[0]) continue;
      const perms = [...new Set([...(rows[0].permissions ?? []), ...WORKFLOW_PERMS])];
      await q.query(`UPDATE roles SET permissions = ${pgArray(perms)} WHERE is_system = true AND name = '${role}'`);
    }
    const memberRows = await q.query(`SELECT permissions FROM roles WHERE is_system = true AND name = 'member' LIMIT 1`);
    if (memberRows[0]) {
      const perms = [...new Set([...(memberRows[0].permissions ?? []), 'workflows:read'])];
      await q.query(`UPDATE roles SET permissions = ${pgArray(perms)} WHERE is_system = true AND name = 'member'`);
    }

    // Migrate automations into workflows (one workflow per automation).
    const autos = await q.query(`SELECT id, tenant_id, name, status, definition FROM automations WHERE deleted_at IS NULL`);
    for (const auto of autos) {
      const def = auto.definition ?? {};
      const trigger = def.trigger ?? {};
      const steps = Array.isArray(def.steps) ? def.steps : [];
      const wfStatus = auto.status === 'active' ? 'published' : 'paused';
      const wfDef = {
        trigger: { type: trigger.event ?? 'contact.created', config: trigger.config ?? {} },
        steps: steps.map((s: Record<string, unknown>) => {
          if (s.type === 'send') {
            return {
              type: 'send_email',
              templateId: s.templateId,
              fromEmail: s.fromEmail,
              fromName: s.fromName,
            };
          }
          if (s.type === 'delay') {
            const ms = typeof s.durationMs === 'number' ? s.durationMs : 0;
            return { type: 'delay', durationSeconds: Math.max(1, Math.round(ms / 1000)) };
          }
          if (s.type === 'branch') {
            return {
              type: 'condition',
              field: s.field,
              op: s.op ?? 'eq',
              value: s.value,
              thenStep: s.thenStep,
              elseStep: s.elseStep,
            };
          }
          return s;
        }),
      };

      const wfRows = await q.query(
        `INSERT INTO workflows (tenant_id, name, status) VALUES ($1, $2, $3) RETURNING id`,
        [auto.tenant_id, auto.name, wfStatus],
      );
      const wfId = wfRows[0].id;

      const verRows = await q.query(
        `INSERT INTO workflow_versions (tenant_id, workflow_id, version, definition) VALUES ($1, $2, 1, $3::jsonb) RETURNING id`,
        [auto.tenant_id, wfId, JSON.stringify(wfDef)],
      );
      const verId = verRows[0].id;

      if (wfStatus === 'published') {
        await q.query(`UPDATE workflows SET current_version_id = $1 WHERE id = $2`, [verId, wfId]);
        await q.query(
          `INSERT INTO workflow_triggers (tenant_id, workflow_id, workflow_version_id, trigger_type, trigger_config)
           VALUES ($1, $2, $3, $4, $5::jsonb)`,
          [auto.tenant_id, wfId, verId, wfDef.trigger.type, JSON.stringify(wfDef.trigger.config ?? {})],
        );
        for (let i = 0; i < (wfDef.steps?.length ?? 0); i++) {
          const step = wfDef.steps[i];
          if (step.type === 'send_email') {
            await q.query(
              `INSERT INTO workflow_actions (tenant_id, workflow_id, workflow_version_id, action_type, position_in_graph)
               VALUES ($1, $2, $3, 'send_email', $4)`,
              [auto.tenant_id, wfId, verId, `step-${i}`],
            );
          } else if (step.type === 'send_sms') {
            await q.query(
              `INSERT INTO workflow_actions (tenant_id, workflow_id, workflow_version_id, action_type, position_in_graph)
               VALUES ($1, $2, $3, 'send_sms', $4)`,
              [auto.tenant_id, wfId, verId, `step-${i}`],
            );
          }
        }
      }
    }
  }

  async down(): Promise<void> {}
}
