import { Module } from '@nestjs/common';
import { SendgridModule } from '../sendgrid/sendgrid.module';
import { ConfigModule } from '../../config/config.module';
import { QueueService } from './queue.service';

@Module({
  imports: [ConfigModule, SendgridModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
