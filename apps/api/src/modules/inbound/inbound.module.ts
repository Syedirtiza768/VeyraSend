import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { InboundWebhookController, InboundController } from './inbound.controller';
import { InboundService } from './inbound.service';

@Module({
  imports: [ConfigModule, ConversationsModule],
  controllers: [InboundWebhookController, InboundController],
  providers: [InboundService],
  exports: [InboundService],
})
export class InboundModule {}
