import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MessagesModule } from '../messages/messages.module';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [AuditModule, MessagesModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
