import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ConfigModule } from '../../config/config.module';
import { MessagesModule } from '../messages/messages.module';
import { TemplatesModule } from '../templates/templates.module';
import { SuppressionsModule } from '../suppressions/suppressions.module';
import { TagsModule } from '../tags/tags.module';
import { TasksModule } from '../tasks/tasks.module';
import { SmsModule } from '../sms/sms.module';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { WorkflowDispatchService } from './workflow-dispatch.service';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowQueueService } from './workflow-queue.service';

@Module({
  imports: [
    AuditModule,
    ConfigModule,
    MessagesModule,
    TemplatesModule,
    SuppressionsModule,
    forwardRef(() => TagsModule),
    TasksModule,
    forwardRef(() => SmsModule),
  ],
  controllers: [WorkflowsController],
  providers: [
    WorkflowsService,
    WorkflowDispatchService,
    WorkflowEngineService,
    WorkflowQueueService,
  ],
  exports: [WorkflowDispatchService],
})
export class WorkflowsModule {}
