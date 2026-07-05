import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EmailEvent } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';

export interface EventRow {
  id: string;
  eventType: string;
  sgMessageId: string | null;
  recipient: string | null;
  sgTimestamp: number | null;
  createdAt: string;
}

@Injectable()
export class EventsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async list(tenantId: string, limit = 100): Promise<EventRow[]> {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(EmailEvent).find({
      where: { tenantId: tid },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      sgMessageId: e.sgMessageId,
      recipient: e.recipient,
      sgTimestamp: e.sgTimestamp,
      createdAt: e.createdAt.toISOString(),
    }));
  }
}
