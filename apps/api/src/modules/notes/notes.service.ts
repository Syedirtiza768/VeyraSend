import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Note, type CrmEntityType } from '@veyrasend/db';
import { assertCrmEntityExists } from '../../common/crm-entity';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

export interface NoteRow {
  id: string;
  body: string;
  authorUserId: string;
  entityType: CrmEntityType;
  entityId: string;
  createdAt: string;
}

@Injectable()
export class NotesService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async list(tenantId: string, entityType: CrmEntityType, entityId: string): Promise<NoteRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Note).find({
      where: { tenantId: tid, entityType, entityId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return rows.map((n) => ({
      id: n.id, body: n.body, authorUserId: n.authorUserId,
      entityType: n.entityType, entityId: n.entityId, createdAt: n.createdAt.toISOString(),
    }));
  }

  async create(tenantId: string, authorUserId: string, input: {
    body: string; entityType: CrmEntityType; entityId: string;
  }): Promise<NoteRow> {
    const tid = assertTenant(tenantId);
    const body = input.body.trim();
    if (!body) throw new BadRequestException('body is required');
    await assertCrmEntityExists(this.ds, tid, input.entityType, input.entityId);
    const row = this.ds.getRepository(Note).create({
      tenantId: tid, body, authorUserId, entityType: input.entityType, entityId: input.entityId,
    });
    await this.ds.getRepository(Note).save(row);
    return {
      id: row.id, body: row.body, authorUserId: row.authorUserId,
      entityType: row.entityType, entityId: row.entityId, createdAt: row.createdAt.toISOString(),
    };
  }

  async remove(tenantId: string, id: string): Promise<NoteRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Note).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Note not found in this tenant.');
    const snapshot = {
      id: row.id, body: row.body, authorUserId: row.authorUserId,
      entityType: row.entityType, entityId: row.entityId, createdAt: row.createdAt.toISOString(),
    };
    await this.ds.getRepository(Note).delete({ id, tenantId: tid });
    return snapshot;
  }
}
