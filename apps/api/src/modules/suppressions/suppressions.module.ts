import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SuppressionsController } from './suppressions.controller';
import { SuppressionsService } from './suppressions.service';

@Module({
  imports: [AuditModule],
  controllers: [SuppressionsController],
  providers: [SuppressionsService],
  exports: [SuppressionsService],
})
export class SuppressionsModule {}
