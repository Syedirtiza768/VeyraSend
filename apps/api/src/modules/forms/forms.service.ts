import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Form, FormField, FormSubmission } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { ContactsService } from '../contacts/contacts.service';
import { WorkflowDispatchService } from '../workflows/workflow-dispatch.service';

export interface FormFieldRow {
  id: string;
  label: string;
  fieldKey: string;
  fieldType: string;
  required: boolean;
  position: number;
  options: string[] | null;
}

export interface FormRow {
  id: string;
  name: string;
  spamProtection: string;
  redirectUrl: string | null;
  fields: FormFieldRow[];
  createdAt: string;
}

@Injectable()
export class FormsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly contacts: ContactsService,
    @Inject(forwardRef(() => WorkflowDispatchService)) private readonly workflows: WorkflowDispatchService,
  ) {}

  async list(tenantId: string): Promise<FormRow[]> {
    const tid = assertTenant(tenantId);
    const forms = await this.ds.getRepository(Form).find({ where: { tenantId: tid }, order: { createdAt: 'DESC' } });
    const out: FormRow[] = [];
    for (const f of forms) {
      out.push(await this.toRow(f));
    }
    return out;
  }

  async getById(tenantId: string, id: string): Promise<FormRow> {
    const tid = assertTenant(tenantId);
    const form = await this.ds.getRepository(Form).findOne({ where: { id, tenantId: tid } });
    if (!form) throw new NotFoundException('Form not found in this tenant.');
    return this.toRow(form);
  }

  async create(tenantId: string, name: string): Promise<FormRow> {
    const tid = assertTenant(tenantId);
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('name is required');
    const form = this.ds.getRepository(Form).create({ tenantId: tid, name: trimmed });
    await this.ds.getRepository(Form).save(form);
    return this.toRow(form);
  }

  async replaceFields(tenantId: string, formId: string, fields: Array<{
    label: string;
    fieldKey: string;
    fieldType: string;
    required?: boolean;
    position: number;
    options?: string[] | null;
  }>): Promise<FormRow> {
    const tid = assertTenant(tenantId);
    const form = await this.ds.getRepository(Form).findOne({ where: { id: formId, tenantId: tid } });
    if (!form) throw new NotFoundException('Form not found in this tenant.');
    await this.ds.getRepository(FormField).delete({ tenantId: tid, formId });
    for (const f of fields) {
      await this.ds.getRepository(FormField).save(
        this.ds.getRepository(FormField).create({
          tenantId: tid,
          formId,
          label: f.label,
          fieldKey: f.fieldKey,
          fieldType: f.fieldType as never,
          required: f.required ?? false,
          position: f.position,
          options: f.options ?? null,
        }),
      );
    }
    return this.toRow(form);
  }

  async submit(formId: string, body: Record<string, unknown>, ip: string | null): Promise<{ ok: boolean; contactId?: string; spam?: boolean }> {
    const form = await this.ds.getRepository(Form).findOne({ where: { id: formId } });
    if (!form || form.deletedAt) throw new NotFoundException('Form not found.');

    const honeypot = body._honeypot ?? body.website;
    const isSpam = typeof honeypot === 'string' && honeypot.trim().length > 0;
    const data = { ...body };
    delete data._honeypot;
    delete data.website;
    const utm = (body.utm && typeof body.utm === 'object') ? body.utm as Record<string, unknown> : null;

    let contactId: string | null = null;
    if (!isSpam) {
      contactId = await this.mapToContact(form.tenantId, data, utm);
    }

    const sub = this.ds.getRepository(FormSubmission).create({
      tenantId: form.tenantId,
      formId: form.id,
      contactId,
      data,
      utm,
      ipAddress: ip,
      isSpam,
    });
    await this.ds.getRepository(FormSubmission).save(sub);

    if (isSpam) return { ok: false, spam: true };

    if (contactId) {
      await this.workflows.dispatch(form.tenantId, 'form.submitted', {
        contactId,
        formId: form.id,
        submissionId: sub.id,
      }).catch(() => undefined);
    }

    return { ok: true, contactId: contactId ?? undefined };
  }

  async listSubmissions(tenantId: string, formId: string) {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(FormSubmission).find({
      where: { tenantId: tid, formId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return rows.map((s) => ({
      id: s.id,
      contactId: s.contactId,
      data: s.data,
      utm: s.utm,
      isSpam: s.isSpam,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  private async mapToContact(tenantId: string, data: Record<string, unknown>, utm: Record<string, unknown> | null): Promise<string | null> {
    const email = String(data.email ?? data.Email ?? '').toLowerCase().trim();
    if (!email || !email.includes('@')) return null;
    const firstName = data.first_name ?? data.firstName ?? null;
    const lastName = data.last_name ?? data.lastName ?? null;
    const phone = data.phone ?? null;
    const leadSource = utm?.utm_source ? String(utm.utm_source) : null;
    const row = await this.contacts.upsert(tenantId, {
      email,
      firstName: firstName ? String(firstName) : null,
      lastName: lastName ? String(lastName) : null,
      phone: phone ? String(phone) : null,
      leadSource,
    });
    return row.id;
  }

  private async toRow(form: Form): Promise<FormRow> {
    const fields = await this.ds.getRepository(FormField).find({
      where: { tenantId: form.tenantId, formId: form.id },
      order: { position: 'ASC' },
    });
    return {
      id: form.id,
      name: form.name,
      spamProtection: form.spamProtection,
      redirectUrl: form.redirectUrl,
      fields: fields.map((f) => ({
        id: f.id,
        label: f.label,
        fieldKey: f.fieldKey,
        fieldType: f.fieldType,
        required: f.required,
        position: f.position,
        options: f.options,
      })),
      createdAt: form.createdAt.toISOString(),
    };
  }
}
