import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TwilioIntegrationModule } from '../twilio/twilio-integration.module';
import { PhoneNumbersController } from './phone-numbers.controller';
import { PhoneNumbersService } from './phone-numbers.service';

@Module({
  imports: [AuditModule, TwilioIntegrationModule],
  controllers: [PhoneNumbersController],
  providers: [PhoneNumbersService],
  exports: [PhoneNumbersService],
})
export class PhoneNumbersModule {}
