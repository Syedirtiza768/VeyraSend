import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SegmentsModule } from '../segments/segments.module';
import { SuppressionsModule } from '../suppressions/suppressions.module';
import { TemplatesModule } from '../templates/templates.module';
import { MessagesModule } from '../messages/messages.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [AuditModule, SegmentsModule, SuppressionsModule, TemplatesModule, MessagesModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
