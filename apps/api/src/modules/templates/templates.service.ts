import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Template, TemplateVersion, type TemplateVariable } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { MessagesService } from '../messages/messages.service';

export interface TemplateRow {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string | null;
  generation: string;
  variables: TemplateVariable[];
  version: number;
  createdAt: string;
}

export interface CreateTemplateInput {
  name: string;
  subject: string;
  html: string;
  text?: string | null;
  generation?: 'dynamic' | 'legacy';
  variables?: TemplateVariable[];
}

function toRow(t: Template): TemplateRow {
  return {
    id: t.id,
    name: t.name,
    subject: t.subject,
    html: t.html,
    text: t.text,
    generation: t.generation,
    variables: t.variables ?? [],
    version: t.version,
    createdAt: t.createdAt.toISOString(),
  };
}

/** Tiny mustache-style renderer: replaces {{key}} (and {{ key }}) with values. */
export function render(input: string, vars: Record<string, unknown>, variables: TemplateVariable[]): string {
  return input.replace(/{{\s*([\w.]+)\s*}}/g, (_m, key: string) => {
    const v = vars[key];
    if (v !== undefined && v !== null) return String(v);
    const spec = variables.find((s) => s.key === key);
    return spec?.fallback ?? '';
  });
}

@Injectable()
export class TemplatesService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly messages: MessagesService,
  ) {}

  async list(tenantId: string): Promise<TemplateRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Template).find({
      where: { tenantId: tid },
      order: { createdAt: 'DESC' },
    });
    return rows.map(toRow);
  }

  async getById(tenantId: string, id: string): Promise<TemplateRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Template).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Template not found in this tenant.');
    return toRow(row);
  }

  async create(tenantId: string, input: CreateTemplateInput): Promise<TemplateRow> {
    const tid = assertTenant(tenantId);
    if (!input.name.trim() || !input.subject.trim()) {
      throw new BadRequestException('name and subject are required');
    }
    const existing = await this.ds.getRepository(Template).findOne({ where: { tenantId: tid, name: input.name.trim() } });
    if (existing) throw new BadRequestException('A template with that name already exists.');

    const row = this.ds.getRepository(Template).create({
      tenantId: tid,
      name: input.name.trim(),
      subject: input.subject,
      html: input.html,
      text: input.text ?? null,
      generation: input.generation ?? 'dynamic',
      variables: input.variables ?? [],
      version: 1,
    });
    await this.ds.getRepository(Template).save(row);

    // Snapshot v1.
    await this.snapshot(row, 1);
    return toRow(row);
  }

  async update(tenantId: string, id: string, patch: Partial<CreateTemplateInput>): Promise<TemplateRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Template).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Template not found in this tenant.');

    if (patch.subject !== undefined) row.subject = patch.subject;
    if (patch.html !== undefined) row.html = patch.html;
    if (patch.text !== undefined) row.text = patch.text ?? null;
    if (patch.generation !== undefined) row.generation = patch.generation;
    if (patch.variables !== undefined) row.variables = patch.variables;
    row.version = row.version + 1;
    await this.ds.getRepository(Template).save(row);
    // Persist a snapshot of the new version.
    await this.snapshot(row, row.version);
    return toRow(row);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Template).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Template not found in this tenant.');
    await this.ds.getRepository(Template).softDelete({ id, tenantId: tid });
  }

  async versions(tenantId: string, id: string): Promise<Array<{ version: number; createdAt: string }>> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(TemplateVersion).find({
      where: { tenantId: tid, templateId: id },
      order: { version: 'DESC' },
    });
    return rows.map((v) => ({ version: v.version, createdAt: v.createdAt.toISOString() }));
  }

  preview(tenantId: string, id: string, vars: Record<string, unknown>): Promise<{ subject: string; html: string; text: string | null }> {
    return this.previewAsync(tenantId, id, vars);
  }

  async previewAsync(tenantId: string, id: string, vars: Record<string, unknown>): Promise<{ subject: string; html: string; text: string | null }> {
    const t = await this.getById(tenantId, id);
    return {
      subject: render(t.subject, vars, t.variables),
      html: render(t.html, vars, t.variables),
      text: t.text ? render(t.text, vars, t.variables) : null,
    };
  }

  async testSend(tenantId: string, actorUserId: string | null, id: string, toEmail: string, vars: Record<string, unknown>): Promise<{ messageId: string }> {
    const t = await this.getById(tenantId, id);
    const rendered = await this.previewAsync(tenantId, id, vars);
    const msg = await this.messages.send(tenantId, actorUserId, {
      fromEmail: 'test@template.preview',
      toEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text ?? undefined,
      dynamicTemplateData: vars,
      templateId: id,
    });
    return { messageId: msg.id };
  }

  private async snapshot(t: Template, version: number): Promise<void> {
    const snap = this.ds.getRepository(TemplateVersion).create({
      tenantId: t.tenantId,
      templateId: t.id,
      version,
      subject: t.subject,
      html: t.html,
      text: t.text,
      generation: t.generation,
      variables: t.variables,
    });
    await this.ds.getRepository(TemplateVersion).save(snap);
  }
}
