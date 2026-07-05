import { Module, forwardRef } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { SmsModule } from '../sms/sms.module';
import { MessagesModule } from '../messages/messages.module';
import { PhoneNumbersModule } from '../phone-numbers/phone-numbers.module';
import { SendersModule } from '../senders/senders.module';

@Module({
  imports: [
    forwardRef(() => SmsModule),
    MessagesModule,
    PhoneNumbersModule,
    SendersModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
