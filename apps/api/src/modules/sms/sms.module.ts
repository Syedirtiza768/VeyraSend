import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { PhoneNumbersModule } from '../phone-numbers/phone-numbers.module';
import { TwilioIntegrationModule } from '../twilio/twilio-integration.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';

@Module({
  imports: [AuditModule, TwilioIntegrationModule, PhoneNumbersModule, forwardRef(() => ConversationsModule), forwardRef(() => WorkflowsModule)],
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
