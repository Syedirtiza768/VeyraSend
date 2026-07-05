import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditReaderService } from './audit-reader.service';
import { AuditController } from './audit.controller';

@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditReaderService],
  exports: [AuditService, AuditReaderService],
})
export class AuditModule {}
