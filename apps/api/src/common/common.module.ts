import { Global, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { DbModule } from './db.module';
import { CorrelationMiddleware } from './correlation.middleware';
import { CryptoService } from './crypto.service';

@Global()
@Module({
  imports: [DbModule],
  providers: [CryptoService],
  exports: [DbModule, CryptoService],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
