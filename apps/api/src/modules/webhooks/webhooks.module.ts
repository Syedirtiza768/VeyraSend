import { Module, forwardRef } from '@nestjs/common';
import { SendgridModule } from '../sendgrid/sendgrid.module';
import { ContactsModule } from '../contacts/contacts.module';
import { SuppressionsModule } from '../suppressions/suppressions.module';
import { PhoneNumbersModule } from '../phone-numbers/phone-numbers.module';
import { SmsModule } from '../sms/sms.module';
import { VoiceModule } from '../voice/voice.module';
import { TwilioIntegrationModule } from '../twilio/twilio-integration.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { BillingModule } from '../billing/billing.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { TwilioWebhooksService } from './twilio-webhooks.service';
import { StripeWebhooksService } from './stripe-webhooks.service';

@Module({
  imports: [
    SendgridModule, ContactsModule, SuppressionsModule, TwilioIntegrationModule,
    PhoneNumbersModule, SmsModule, VoiceModule, BillingModule,
    forwardRef(() => WorkflowsModule),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, TwilioWebhooksService, StripeWebhooksService],
})
export class WebhooksModule {}
