import { Module, forwardRef } from '@nestjs/common';
import { MessagesModule } from '../messages/messages.module';
import { SmsModule } from '../sms/sms.module';
import { PhoneNumbersModule } from '../phone-numbers/phone-numbers.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { BillingController } from './billing.controller';
import { InvoicesService } from './invoices.service';
import { PaymentLinksService } from './payment-links.service';
import { BillingWebhookService } from './billing-webhook.service';
import { StripeIntegrationService } from './stripe-integration.service';

@Module({
  imports: [
    MessagesModule,
    SmsModule,
    PhoneNumbersModule,
    forwardRef(() => WorkflowsModule),
  ],
  controllers: [BillingController],
  providers: [
    StripeIntegrationService,
    InvoicesService,
    PaymentLinksService,
    BillingWebhookService,
  ],
  exports: [BillingWebhookService, StripeIntegrationService],
})
export class BillingModule {}
