import { Module } from '@nestjs/common';
import { SendgridModule } from '../sendgrid/sendgrid.module';
import { QueueModule } from '../queue/queue.module';
import { AuditModule } from '../audit/audit.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [SendgridModule, QueueModule, AuditModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
