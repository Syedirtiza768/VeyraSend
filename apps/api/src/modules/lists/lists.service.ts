import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { List, ListMembership, Contact } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

export interface ListRow {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
}

@Injectable()
export class ListsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async list(tenantId: string): Promise<ListRow[]> {
    const tid = assertTenant(tenantId);
    const lists = await this.ds.getRepository(List).find({
      where: { tenantId: tid },
      order: { createdAt: 'DESC' },
    });
    if (lists.length === 0) return [];
    const counts = await this.ds
      .getRepository(ListMembership)
      .createQueryBuilder('m')
      .select('m.listId', 'listId')
      .addSelect('COUNT(*)', 'count')
      .where('m.tenantId = :tid', { tid })
      .andWhere('m.listId IN (:...ids)', { ids: lists.map((l) => l.id) })
      .groupBy('m.listId')
      .getRawMany<{ listId: string; count: string }>();
    const map = new Map(counts.map((c) => [c.listId, Number(c.count)]));
    return lists.map((l) => ({
      id: l.id,
      name: l.name,
      memberCount: map.get(l.id) ?? 0,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async create(tenantId: string, name: string): Promise<ListRow> {
    const tid = assertTenant(tenantId);
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('name is required');
    const existing = await this.ds.getRepository(List).findOne({ where: { tenantId: tid, name: trimmed } });
    if (existing) throw new ConflictException('A list with that name already exists.');
    const row = this.ds.getRepository(List).create({ tenantId: tid, name: trimmed });
    await this.ds.getRepository(List).save(row);
    return { id: row.id, name: row.name, memberCount: 0, createdAt: row.createdAt.toISOString() };
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(List).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('List not found in this tenant.');
    await this.ds.getRepository(List).delete({ id, tenantId: tid });
  }

  async addContact(tenantId: string, listId: string, contactId: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const list = await this.ds.getRepository(List).findOne({ where: { id: listId, tenantId: tid } });
    if (!list) throw new NotFoundException('List not found in this tenant.');
    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: contactId, tenantId: tid } });
    if (!contact) throw new NotFoundException('Contact not found in this tenant.');
    const existing = await this.ds
      .getRepository(ListMembership)
      .findOne({ where: { tenantId: tid, listId, contactId } });
    if (existing) return; // idempotent
    await this.ds.getRepository(ListMembership).save(
      this.ds.getRepository(ListMembership).create({ tenantId: tid, listId, contactId }),
    );
  }

  async removeContact(tenantId: string, listId: string, contactId: string): Promise<void> {
    const tid = assertTenant(tenantId);
    await this.ds.getRepository(ListMembership).delete({ tenantId: tid, listId, contactId });
  }

  async members(tenantId: string, listId: string): Promise<{ id: string; email: string; status: string }[]> {
    const tid = assertTenant(tenantId);
    const memberships = await this.ds.getRepository(ListMembership).find({ where: { tenantId: tid, listId } });
    if (memberships.length === 0) return [];
    const contacts = await this.ds.getRepository(Contact).find({
      where: memberships.map((m) => ({ id: m.contactId, tenantId: tid })),
    });
    return contacts.map((c) => ({ id: c.id, email: c.email, status: c.status }));
  }

  /** Returns the contact ids that belong to a list (used by segment eval / campaigns). */
  async memberIds(tenantId: string, listId: string): Promise<string[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds
      .getRepository(ListMembership)
      .find({ where: { tenantId: tid, listId }, select: ['contactId'] });
    return rows.map((r) => r.contactId);
  }
}
