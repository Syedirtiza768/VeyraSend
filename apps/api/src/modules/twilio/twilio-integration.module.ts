import { Module } from '@nestjs/common';
import { TwilioClient } from '@veyrasend/twilio';
import { AuditModule } from '../audit/audit.module';
import { TwilioIntegrationController } from './twilio-integration.controller';
import { TwilioIntegrationService } from './twilio-integration.service';

@Module({
  imports: [AuditModule],
  controllers: [TwilioIntegrationController],
  providers: [
    { provide: TwilioClient, useFactory: () => new TwilioClient() },
    TwilioIntegrationService,
  ],
  exports: [TwilioClient, TwilioIntegrationService],
})
export class TwilioIntegrationModule {}
