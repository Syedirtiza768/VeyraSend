import { BadRequestException, GoneException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, LessThanOrEqual } from 'typeorm';
import { Automation, AutomationEnrollment, Contact, type AutomationDefinition, type AutomationStep } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { TemplatesService, render } from '../templates/templates.service';
import { SuppressionsService } from '../suppressions/suppressions.service';
import { MessagesService } from '../messages/messages.service';

export interface AutomationRow {
  id: string;
  name: string;
  status: 'active' | 'paused';
  definition: AutomationDefinition;
  createdAt: string;
}

export interface CreateAutomationInput {
  name: string;
  definition: AutomationDefinition;
}

function toRow(a: Automation): AutomationRow {
  return { id: a.id, name: a.name, status: a.status, definition: a.definition, createdAt: a.createdAt.toISOString() };
}

/**
 * Phase 8 — automations. A periodic ticker (exposed as `tick()`) enrolls newly
 * created contacts into active `contact.created` automations and advances due
 * enrollments one step per tick. Steps may be `send`, `delay`, or `branch`.
 * Suppressed contacts are skipped at send time.
 */
@Injectable()
export class AutomationsService {
  private readonly logger = new Logger('AutomationsService');

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly templates: TemplatesService,
    private readonly suppressions: SuppressionsService,
    private readonly messages: MessagesService,
  ) {}

  private static readonly READ_ONLY_MSG =
    'Automations are read-only. Use /api/workflows instead (Phase 15).';

  async list(tenantId: string): Promise<AutomationRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(Automation).find({ where: { tenantId: tid }, order: { createdAt: 'DESC' } });
    return rows.map(toRow);
  }

  async getById(tenantId: string, id: string): Promise<AutomationRow> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(Automation).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Automation not found in this tenant.');
    return toRow(row);
  }

  async create(tenantId: string, input: CreateAutomationInput): Promise<AutomationRow> {
    throw new GoneException(AutomationsService.READ_ONLY_MSG);
  }

  async setStatus(tenantId: string, id: string, status: 'active' | 'paused'): Promise<AutomationRow> {
    throw new GoneException(AutomationsService.READ_ONLY_MSG);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    throw new GoneException(AutomationsService.READ_ONLY_MSG);
  }

  async enrollments(tenantId: string, automationId: string): Promise<Array<{ state: string; currentStep: number; nextAt: string }>> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(AutomationEnrollment).find({
      where: { tenantId: tid, automationId },
      order: { enrolledAt: 'DESC' },
    });
    return rows.map((e) => ({ state: e.state, currentStep: e.currentStep, nextAt: e.nextAt.toISOString() }));
  }

  // -- ticker ----------------------------------------------------------------

  /** Runs one pass of enrollment + step advancement. Safe to call from tests. */
  async tick(): Promise<void> {
    await this.enrollNewContacts();
    await this.advanceDue();
  }

  private async enrollNewContacts(): Promise<void> {
    const automations = await this.ds.getRepository(Automation).find({ where: { status: 'active' as never } });
    for (const auto of automations) {
      if (auto.definition.trigger?.event !== 'contact.created') continue;
      const existing = await this.ds.getRepository(AutomationEnrollment).find({
        where: { tenantId: auto.tenantId, automationId: auto.id },
        select: ['contactId'],
      });
      const enrolledIds = new Set(existing.map((e) => e.contactId));
      const contacts = await this.ds.getRepository(Contact).find({ where: { tenantId: auto.tenantId } });
      const fresh = contacts.filter((c) => c.deletedAt === null && !enrolledIds.has(c.id));
      for (const c of fresh) {
        await this.ds.getRepository(AutomationEnrollment).save(
          this.ds.getRepository(AutomationEnrollment).create({
            tenantId: auto.tenantId,
            automationId: auto.id,
            contactId: c.id,
            currentStep: 0,
            state: 'active',
            nextAt: new Date(),
            enrolledAt: c.createdAt ?? new Date(),
          }),
        );
      }
    }
  }

  private async advanceDue(): Promise<void> {
    const due = await this.ds.getRepository(AutomationEnrollment).find({
      where: { state: 'active' as never, nextAt: LessThanOrEqual(new Date() as never) as never },
      take: 200,
    });
    for (const en of due) {
      await this.processOne(en);
    }
  }

  private async processOne(en: AutomationEnrollment): Promise<void> {
    const auto = await this.ds.getRepository(Automation).findOne({ where: { id: en.automationId } });
    if (!auto || auto.status !== 'active') return;
    const steps = auto.definition.steps;
    if (en.currentStep >= steps.length) {
      en.state = 'completed';
      await this.ds.getRepository(AutomationEnrollment).save(en);
      return;
    }
    const step = steps[en.currentStep]!;
    const contact = await this.ds.getRepository(Contact).findOne({ where: { id: en.contactId, tenantId: en.tenantId } });
    if (!contact || contact.deletedAt) {
      en.state = 'exited';
      await this.ds.getRepository(AutomationEnrollment).save(en);
      return;
    }

    if (step.type === 'send') {
      await this.doSend(auto, step, contact);
      en.currentStep = en.currentStep + 1;
      en.nextAt = new Date();
    } else if (step.type === 'delay') {
      en.currentStep = en.currentStep + 1;
      en.nextAt = new Date(Date.now() + (step.durationMs ?? 0));
    } else if (step.type === 'branch') {
      const matched = this.evalBranch(step, contact);
      en.currentStep = matched ? (step.thenStep ?? en.currentStep + 1) : (step.elseStep ?? en.currentStep + 1);
      en.nextAt = new Date();
    }
    await this.ds.getRepository(AutomationEnrollment).save(en);
  }

  private async doSend(auto: Automation, step: AutomationStep, contact: Contact): Promise<void> {
    if (!step.templateId || !step.fromEmail) return;
    const suppressed = await this.suppressions.suppressedEmails(auto.tenantId);
    if (suppressed.has(contact.email) || contact.status !== 'active') return;

    const template = await this.templates.getById(auto.tenantId, step.templateId);
    const vars: Record<string, unknown> = {
      first_name: contact.firstName ?? '',
      last_name: contact.lastName ?? '',
      email: contact.email,
      ...(contact.customFields ?? {}),
    };
    const subject = render(template.subject, vars, template.variables);
    const html = render(template.html, vars, template.variables);
    await this.messages.enqueueAutomationMessage(auto.tenantId, {
      fromEmail: step.fromEmail,
      fromName: step.fromName ?? null,
      toEmail: contact.email,
      subject,
      html,
      templateId: template.id,
      dynamicTemplateData: vars,
    });
  }

  private evalBranch(step: AutomationStep, contact: Contact): boolean {
    if (!step.field || !step.op || step.value === undefined) return false;
    let actual = '';
    if (step.field === 'email') actual = contact.email;
    else if (step.field === 'status') actual = contact.status;
    else if (step.field.startsWith('custom:')) {
      const key = step.field.slice('custom:'.length);
      actual = contact.customFields?.[key] === undefined ? '' : String(contact.customFields[key]);
    }
    const a = actual.toLowerCase();
    const v = String(step.value).toLowerCase();
    if (step.op === 'eq') return a === v;
    if (step.op === 'ne') return a !== v;
    if (step.op === 'contains') return a.includes(v);
    return false;
  }

  private validateDefinition(def: AutomationDefinition): void {
    if (!def || def.trigger?.event !== 'contact.created') {
      throw new BadRequestException('trigger.event must be "contact.created"');
    }
    if (!Array.isArray(def.steps)) throw new BadRequestException('steps must be an array');
    for (const s of def.steps) {
      if (s.type === 'send' && (!s.templateId || !s.fromEmail)) {
        throw new BadRequestException('send step requires templateId and fromEmail');
      }
      if (s.type === 'delay' && typeof s.durationMs !== 'number') {
        throw new BadRequestException('delay step requires durationMs');
      }
      if (s.type === 'branch' && (s.field === undefined || s.thenStep === undefined || s.elseStep === undefined)) {
        throw new BadRequestException('branch step requires field, thenStep, elseStep');
      }
    }
  }
}
