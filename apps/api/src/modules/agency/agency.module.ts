import { Module } from '@nestjs/common';
import { TenantsModule } from '../tenants/tenants.module';
import { AuditModule } from '../audit/audit.module';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { FeatureFlagsService } from './feature-flags.service';

@Module({
  imports: [TenantsModule, AuditModule],
  controllers: [AgencyController],
  providers: [AgencyService, FeatureFlagsService],
  exports: [AgencyService, FeatureFlagsService],
})
export class AgencyModule {}
