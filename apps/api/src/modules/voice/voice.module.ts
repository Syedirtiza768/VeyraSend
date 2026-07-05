import { Module, forwardRef } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { PhoneNumbersModule } from '../phone-numbers/phone-numbers.module';
import { SmsModule } from '../sms/sms.module';
import { TwilioIntegrationModule } from '../twilio/twilio-integration.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';

@Module({
  imports: [TwilioIntegrationModule, PhoneNumbersModule, SmsModule, ConversationsModule, forwardRef(() => WorkflowsModule)],
  controllers: [VoiceController],
  providers: [VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}
