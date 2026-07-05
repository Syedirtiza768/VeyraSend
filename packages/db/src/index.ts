import { loadConfig } from '@veyrasend/config';

export { Tenant, type TenantType, type WhiteLabelConfig } from './entities/tenant.entity';
export { User } from './entities/user.entity';
export { Role, PERMISSIONS, SYSTEM_ROLES } from './entities/role.entity';
export type { Permission } from './entities/role.entity';
export { TenantMembership } from './entities/tenant-membership.entity';
export { AuditLog } from './entities/audit-log.entity';
export { TenantSendgridSettings } from './entities/tenant-sendgrid-settings.entity';
export { Sender } from './entities/sender.entity';
export { Domain, type DomainDnsRecord } from './entities/domain.entity';
export { Message, type MessageStatus, type MessageKind } from './entities/message.entity';
export {
  TenantTwilioSettings, PhoneNumber, Call, CallRecording, VoicemailMessage, TwilioEvent, UsageRecord,
} from './entities/twilio.entity';
export { EmailEvent } from './entities/email-event.entity';
export { Contact, type ContactStatus, type LifecycleStage, type SmsOptInStatus } from './entities/contact.entity';
export { Company } from './entities/company.entity';
export { Pipeline } from './entities/pipeline.entity';
export { PipelineStage } from './entities/pipeline-stage.entity';
export { Deal, type DealStatus } from './entities/deal.entity';
export { Task, type TaskStatus, type CrmEntityType } from './entities/task.entity';
export { Note } from './entities/note.entity';
export { Tag, ContactTag } from './entities/tag.entity';
export { CustomField, CustomFieldValue, type CustomFieldType } from './entities/custom-field.entity';
export { List } from './entities/list.entity';
export { ListMembership } from './entities/list-membership.entity';
export { Segment, type SegmentRule, type SegmentDefinition } from './entities/segment.entity';
export { Suppression, type SuppressionReason } from './entities/suppression.entity';
export { Template, type TemplateVariable, type TemplateGeneration } from './entities/template.entity';
export { TemplateVersion } from './entities/template-version.entity';
export { Campaign, type CampaignStatus } from './entities/campaign.entity';
export { Conversation, ConversationNote } from './entities/conversation.entity';
export { InboundThread } from './entities/inbound-thread.entity';
export { InboundMessage, type InboundAttachment } from './entities/inbound-message.entity';
export { Automation, type AutomationStatus, type AutomationDefinition, type AutomationStep } from './entities/automation.entity';
export { AutomationEnrollment, type EnrollmentState } from './entities/automation-enrollment.entity';
export {
  Workflow, WorkflowVersion, WorkflowTrigger, WorkflowAction, WorkflowRun, WorkflowRunStep,
  type WorkflowStatus, type WorkflowRunStatus, type WorkflowRunStepStatus,
  type WorkflowDefinition, type WorkflowStepDefinition, type WorkflowNode,
} from './entities/workflow.entity';
export { Calendar, Appointment, type AppointmentStatus, type WeeklyAvailability } from './entities/calendar.entity';
export { Form, FormField, FormSubmission, type FormFieldType } from './entities/form.entity';
export { Funnel, FunnelStep, LandingPage, type LandingPageSection } from './entities/funnel.entity';
export { ReputationSettings, ReviewRequest, type ReviewRequestStatus, type ReviewChannel } from './entities/reputation.entity';
export {
  TenantStripeSettings, Invoice, PaymentLink,
  type InvoiceStatus, type PaymentLinkStatus, type InvoiceLineItem,
} from './entities/billing.entity';
export { BillingPlan, FeatureFlag } from './entities/agency.entity';
export { TenantSettings } from './entities/tenant-settings.entity';
export { default as AppDataSource } from './data-source';
export { BaseEntity } from './base.entity';
export type { TenantScoped } from './base.entity';

export const dbConfig = loadConfig();
