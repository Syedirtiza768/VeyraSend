import { Module, forwardRef } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { PublicRateLimitService } from '../../common/public-rate-limit.service';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';

@Module({
  imports: [ContactsModule, forwardRef(() => WorkflowsModule)],
  controllers: [FormsController],
  providers: [FormsService, PublicRateLimitService],
  exports: [FormsService],
})
export class FormsModule {}
