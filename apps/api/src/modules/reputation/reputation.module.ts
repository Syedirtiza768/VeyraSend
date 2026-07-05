import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { MessagesModule } from '../messages/messages.module';
import { SmsModule } from '../sms/sms.module';
import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';

@Module({
  imports: [ConfigModule, MessagesModule, forwardRef(() => SmsModule)],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
