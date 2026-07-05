import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantSettings } from '@veyrasend/db';
import { InjectDataSource } from '../../common/db.module';
import { SettingsService } from '../settings/settings.service';

/**
 * Phase 10 — retention. A periodic ticker hard-deletes rows older than each
 * tenant's configured retention window. Runs hourly; safe to call `tick()`
 * directly from tests.
 */
@Injectable()
export class RetentionService implements OnApplicationShutdown {
  private readonly logger = new Logger('RetentionService');
  private timer?: NodeJS.Timeout;

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly settings: SettingsService,
  ) {
    this.timer = setInterval(() => this.tick().catch((e) => this.logger.warn(`tick: ${e.message}`)), 3600_000);
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<{ events: number; messages: number; inbound: number }> {
    const allSettings = await this.ds.getRepository(TenantSettings).find();
    let events = 0, messages = 0, inbound = 0;
    for (const s of allSettings) {
      events += await this.deleteOld('email_events', s.eventRetentionDays);
      messages += await this.deleteOld('messages', s.messageRetentionDays);
      inbound += await this.deleteOld('inbound_messages', s.inboundRetentionDays);
    }
    if (events + messages + inbound > 0) {
      this.logger.log(`retention sweep: events=${events} messages=${messages} inbound=${inbound}`);
    }
    return { events, messages, inbound };
  }

  private async deleteOld(table: string, days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 86400_000);
    const res = await this.ds.query(`DELETE FROM "${table}" WHERE created_at < $1 RETURNING id`, [cutoff]);
    return Array.isArray(res) ? res.length : 0;
  }
}
