import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TemplatesModule } from '../templates/templates.module';
import { SuppressionsModule } from '../suppressions/suppressions.module';
import { MessagesModule } from '../messages/messages.module';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';

@Module({
  imports: [AuditModule, TemplatesModule, SuppressionsModule, MessagesModule],
  controllers: [AutomationsController],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
