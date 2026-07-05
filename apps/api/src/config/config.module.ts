import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Global()
@Module({
  providers: [
    {
      provide: ConfigService,
      useFactory: (): ConfigService => new ConfigService(),
    },
  ],
  exports: [ConfigService],
})
export class ConfigModule {}
