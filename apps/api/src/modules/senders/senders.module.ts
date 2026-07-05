import { Module } from '@nestjs/common';
import { SendersService } from './senders.service';
import { SendersController } from './senders.controller';
import { SendgridModule } from '../sendgrid/sendgrid.module';

@Module({
  imports: [SendgridModule],
  controllers: [SendersController],
  providers: [SendersService],
  exports: [SendersService],
})
export class SendersModule {}
