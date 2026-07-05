import { Module } from '@nestjs/common';
import { SendGridClient } from '@veyrasend/sendgrid';
import { ConfigService } from '../../config/config.service';
import { SendgridService } from './sendgrid.service';
import { SendgridController } from './sendgrid.controller';

export const SENDGRID_CLIENT = 'SENDGRID_CLIENT';

@Module({
  controllers: [SendgridController],
  providers: [
    {
      provide: SENDGRID_CLIENT,
      useFactory: (config: ConfigService) => new SendGridClient(config.all.sendgrid),
      inject: [ConfigService],
    },
    {
      provide: SendGridClient,
      useExisting: SENDGRID_CLIENT,
    },
    SendgridService,
  ],
  exports: [SendGridClient, SendgridService, SENDGRID_CLIENT],
})
export class SendgridModule {}
