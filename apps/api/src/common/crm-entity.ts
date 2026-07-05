import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Company, Contact, Deal, type CrmEntityType } from '@veyrasend/db';

export async function assertCrmEntityExists(
  ds: DataSource,
  tenantId: string,
  entityType: CrmEntityType,
  entityId: string,
): Promise<void> {
  let found = false;
  if (entityType === 'contact') {
    found = !!(await ds.getRepository(Contact).findOne({ where: { id: entityId, tenantId } }));
  } else if (entityType === 'deal') {
    found = !!(await ds.getRepository(Deal).findOne({ where: { id: entityId, tenantId } }));
  } else if (entityType === 'company') {
    found = !!(await ds.getRepository(Company).findOne({ where: { id: entityId, tenantId } }));
  }
  if (!found) throw new BadRequestException('entity_not_found');
}
