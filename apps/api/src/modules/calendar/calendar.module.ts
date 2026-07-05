import { Module, forwardRef } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { PublicRateLimitService } from '../../common/public-rate-limit.service';
import { CalendarController, AppointmentsController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [ContactsModule, forwardRef(() => WorkflowsModule)],
  controllers: [CalendarController, AppointmentsController],
  providers: [CalendarService, AppointmentsService, PublicRateLimitService],
  exports: [CalendarService, AppointmentsService],
})
export class CalendarModule {}
