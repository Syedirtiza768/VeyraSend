import { BadRequestException, ConflictException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Contact, ContactTag, Tag } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { WorkflowDispatchService } from '../workflows/workflow-dispatch.service';

export interface TagRow {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
}

@Injectable()
export class TagsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @Inject(forwardRef(() => WorkflowDispatchService)) private readonly workflows: WorkflowDispatchService,
  ) {}

  async list(tenantId: string): Promise<TagRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Tag).find({ where: { tenantId: tid }, order: { name: 'ASC' } });
    return rows.map((t) => ({ id: t.id, name: t.name, color: t.color, createdAt: t.createdAt.toISOString() }));
  }

  async create(tenantId: string, name: string, color?: string | null): Promise<TagRow> {
    const tid = assertTenant(tenantId);
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('name is required');
    const existing = await this.ds.getRepository(Tag).findOne({ where: { tenantId: tid, name: trimmed } });
    if (existing) throw new ConflictException('A tag with that name already exists.');
    const row = this.ds.getRepository(Tag).create({ tenantId: tid, name: trimmed, color: color ?? null });
    await this.ds.getRepository(Tag).save(row);
    return { id: row.id, name: row.name, color: row.color, createdAt: row.createdAt.toISOString() };
  }

  async findOrCreateByName(tenantId: string, name: string): Promise<Tag> {
    const tid = assertTenant(tenantId);
    const trimmed = name.trim();
    const existing = await this.ds.getRepository(Tag).findOne({ where: { tenantId: tid, name: trimmed } });
    if (existing) return existing;
    const row = this.ds.getRepository(Tag).create({ tenantId: tid, name: trimmed });
    return this.ds.getRepository(Tag).save(row);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Tag).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Tag not found in this tenant.');
    await this.ds.getRepository(ContactTag).delete({ tenantId: tid, tagId: id });
    await this.ds.getRepository(Tag).delete({ id, tenantId: tid });
  }

  async contactTags(tenantId: string, contactId: string): Promise<TagRow[]> {
    const tid = assertTenant(tenantId);
    const links = await this.ds.getRepository(ContactTag).find({ where: { tenantId: tid, contactId } });
    if (links.length === 0) return [];
    const tags = await this.ds.getRepository(Tag).find({ where: links.map((l) => ({ id: l.tagId, tenantId: tid })) });
    return tags.map((t) => ({ id: t.id, name: t.name, color: t.color, createdAt: t.createdAt.toISOString() }));
  }

  async attachToContact(tenantId: string, contactId: string, tagIds: string[]): Promise<TagRow[]> {
    const tid = assertTenant(tenantId);
    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: contactId, tenantId: tid } });
    if (!contact) throw new NotFoundException('Contact not found in this tenant.');
    for (const tagId of tagIds) {
      const tag = await this.ds.getRepository(Tag).findOne({ where: { id: tagId, tenantId: tid } });
      if (!tag) throw new NotFoundException('Tag not found in this tenant.');
      const existing = await this.ds.getRepository(ContactTag).findOne({ where: { tenantId: tid, contactId, tagId } });
      if (!existing) {
        await this.ds.getRepository(ContactTag).save(
          this.ds.getRepository(ContactTag).create({ tenantId: tid, contactId, tagId }),
        );
        await this.workflows.dispatch(tid, 'tag.added', { contactId, tagId }).catch(() => undefined);
      }
    }
    return this.contactTags(tid, contactId);
  }

  async detachFromContact(tenantId: string, contactId: string, tagId: string): Promise<void> {
    const tid = assertTenant(tenantId);
    await this.ds.getRepository(ContactTag).delete({ tenantId: tid, contactId, tagId });
  }
}
