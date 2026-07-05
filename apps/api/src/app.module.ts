import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { SendgridModule } from './modules/sendgrid/sendgrid.module';
import { SendersModule } from './modules/senders/senders.module';
import { DomainsModule } from './modules/domains/domains.module';
import { QueueModule } from './modules/queue/queue.module';
import { MessagesModule } from './modules/messages/messages.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { EventsModule } from './modules/events/events.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ListsModule } from './modules/lists/lists.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { SuppressionsModule } from './modules/suppressions/suppressions.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { InboundModule } from './modules/inbound/inbound.module';
import { AutomationsModule } from './modules/automations/automations.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UsageModule } from './modules/usage/usage.module';
import { RetentionModule } from './modules/retention/retention.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { PipelinesModule } from './modules/pipelines/pipelines.module';
import { DealsModule } from './modules/deals/deals.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotesModule } from './modules/notes/notes.module';
import { TagsModule } from './modules/tags/tags.module';
import { CustomFieldsModule } from './modules/custom-fields/custom-fields.module';
import { TwilioIntegrationModule } from './modules/twilio/twilio-integration.module';
import { PhoneNumbersModule } from './modules/phone-numbers/phone-numbers.module';
import { SmsModule } from './modules/sms/sms.module';
import { VoiceModule } from './modules/voice/voice.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { FormsModule } from './modules/forms/forms.module';
import { FunnelsModule } from './modules/funnels/funnels.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { BillingModule } from './modules/billing/billing.module';
import { AgencyModule } from './modules/agency/agency.module';
import { AuthGuard, PermissionsGuard } from './common/guards/auth.guard';
import { CsrfGuard } from './common/guards/csrf.guard';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    AuditModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    SendgridModule,
    SendersModule,
    DomainsModule,
    QueueModule,
    MessagesModule,
    WebhooksModule,
    EventsModule,
    ContactsModule,
    ListsModule,
    SegmentsModule,
    SuppressionsModule,
    TemplatesModule,
    CampaignsModule,
    InboundModule,
    AutomationsModule,
    AnalyticsModule,
    SettingsModule,
    UsageModule,
    RetentionModule,
    CompaniesModule,
    PipelinesModule,
    DealsModule,
    TasksModule,
    NotesModule,
    TagsModule,
    CustomFieldsModule,
    TwilioIntegrationModule,
    PhoneNumbersModule,
    SmsModule,
    VoiceModule,
    ConversationsModule,
    WorkflowsModule,
    CalendarModule,
    FormsModule,
    FunnelsModule,
    ReputationModule,
    BillingModule,
    AgencyModule,
    HealthModule,
  ],
  providers: [
    // Order matters: authenticate, then CSRF, then authorize.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
})
export class AppModule {}
