import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CompaniesModule } from '../companies/companies.module';
import { TagsModule } from '../tags/tags.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [AuditModule, CompaniesModule, TagsModule, forwardRef(() => WorkflowsModule)],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
