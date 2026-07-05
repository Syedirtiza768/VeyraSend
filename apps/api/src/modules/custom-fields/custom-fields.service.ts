import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CustomField, CustomFieldValue, type CustomFieldType } from '@veyrasend/db';
import type { CrmEntityType } from '@veyrasend/db';
import { assertCrmEntityExists } from '../../common/crm-entity';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

@Injectable()
export class CustomFieldsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async listDefinitions(tenantId: string, entityType?: string) {
    const tid = assertTenant(tenantId);
    const where = entityType
      ? { tenantId: tid, entityType: entityType as CrmEntityType | 'deal' }
      : { tenantId: tid };
    const rows = await this.ds.getRepository(CustomField).find({ where, order: { key: 'ASC' } });
    return rows.map((f) => ({
      id: f.id, entityType: f.entityType, key: f.key, label: f.label,
      fieldType: f.fieldType, options: f.options, createdAt: f.createdAt.toISOString(),
    }));
  }

  async createDefinition(tenantId: string, input: {
    entityType: CrmEntityType | 'deal'; key: string; label: string;
    fieldType: CustomFieldType; options?: string[] | null;
  }) {
    const tid = assertTenant(tenantId);
    const key = input.key.trim().toLowerCase().replace(/\s+/g, '_');
    if (!key) throw new BadRequestException('key is required');
    const existing = await this.ds.getRepository(CustomField).findOne({ where: { tenantId: tid, entityType: input.entityType, key } });
    if (existing) throw new ConflictException('A custom field with that key already exists.');
    const row = this.ds.getRepository(CustomField).create({
      tenantId: tid, entityType: input.entityType, key, label: input.label.trim(),
      fieldType: input.fieldType, options: input.options ?? null,
    });
    await this.ds.getRepository(CustomField).save(row);
    return { id: row.id, entityType: row.entityType, key: row.key, label: row.label, fieldType: row.fieldType, options: row.options };
  }

  async getValues(tenantId: string, entityType: CrmEntityType | 'deal', entityId: string) {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(CustomFieldValue).find({
      where: { tenantId: tid, entityType, entityId },
    });
    return rows.map((v) => ({ customFieldId: v.customFieldId, value: v.value }));
  }

  async setValue(tenantId: string, customFieldId: string, entityType: CrmEntityType | 'deal', entityId: string, value: unknown) {
    const tid = assertTenant(tenantId);
    const field = await this.ds.getRepository(CustomField).findOne({ where: { id: customFieldId, tenantId: tid } });
    if (!field) throw new NotFoundException('Custom field not found in this tenant.');
    await assertCrmEntityExists(this.ds, tid, entityType as CrmEntityType, entityId);
    let row = await this.ds.getRepository(CustomFieldValue).findOne({
      where: { tenantId: tid, customFieldId, entityType, entityId },
    });
    if (row) {
      row.value = value;
    } else {
      row = this.ds.getRepository(CustomFieldValue).create({ tenantId: tid, customFieldId, entityType, entityId, value });
    }
    await this.ds.getRepository(CustomFieldValue).save(row);
    return { customFieldId, value };
  }
}
