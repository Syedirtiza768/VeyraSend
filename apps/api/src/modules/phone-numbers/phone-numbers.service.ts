import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PhoneNumber } from '@veyrasend/db';
import { TwilioClient } from '@veyrasend/twilio';
import { InjectDataSource } from '../../common/db.module';
import { assertTenant } from '../../common/scoped';
import { TwilioIntegrationService } from '../twilio/twilio-integration.service';

@Injectable()
export class PhoneNumbersService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly twilio: TwilioIntegrationService,
    private readonly client: TwilioClient,
  ) {}

  async list(tenantId: string) {
    const tid = assertTenant(tenantId);
    const rows = await this.ds.getRepository(PhoneNumber).find({ where: { tenantId: tid }, order: { createdAt: 'DESC' } });
    return rows.map((r) => ({
      id: r.id, e164Number: r.e164Number, status: r.status, assignedUserId: r.assignedUserId,
      forwardTo: r.forwardTo, createdAt: r.createdAt.toISOString(),
    }));
  }

  async search(tenantId: string, areaCode?: string) {
    const auth = await this.twilio.getDecryptedAuth(tenantId);
    return this.client.searchAvailableNumbers({ subaccountSid: auth.subaccountSid, authToken: auth.authToken, areaCode });
  }

  async purchase(tenantId: string, e164Number: string, assignedUserId?: string | null) {
    const tid = assertTenant(tenantId);
    const auth = await this.twilio.getDecryptedAuth(tenantId);
    const purchased = await this.client.purchaseNumber({ subaccountSid: auth.subaccountSid, authToken: auth.authToken, e164Number });
    const row = this.ds.getRepository(PhoneNumber).create({
      tenantId: tid,
      twilioSid: purchased.sid,
      e164Number: purchased.e164,
      capabilities: { sms: true, mms: true, voice: true },
      assignedUserId: assignedUserId ?? null,
    });
    await this.ds.getRepository(PhoneNumber).save(row);
    return { id: row.id, e164Number: row.e164Number, status: row.status };
  }

  async update(tenantId: string, id: string, input: { assignedUserId?: string | null; forwardTo?: string | null }) {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(PhoneNumber).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Phone number not found in this tenant.');
    if (input.assignedUserId !== undefined) row.assignedUserId = input.assignedUserId;
    if (input.forwardTo !== undefined) row.forwardTo = input.forwardTo;
    await this.ds.getRepository(PhoneNumber).save(row);
    return row;
  }

  async release(tenantId: string, id: string): Promise<void> {
    const tid = assertTenant(tenantId);
    const row = await this.ds.getRepository(PhoneNumber).findOne({ where: { id, tenantId: tid } });
    if (!row) throw new NotFoundException('Phone number not found in this tenant.');
    const auth = await this.twilio.getDecryptedAuth(tenantId);
    await this.client.releaseNumber({ subaccountSid: auth.subaccountSid, authToken: auth.authToken, numberSid: row.twilioSid });
    await this.ds.getRepository(PhoneNumber).delete({ id, tenantId: tid });
  }

  async findByE164(e164: string): Promise<PhoneNumber | null> {
    return this.ds.getRepository(PhoneNumber).findOne({ where: { e164Number: e164, status: 'active' } });
  }

  async getById(tenantId: string, id: string): Promise<PhoneNumber> {
    const row = await this.ds.getRepository(PhoneNumber).findOne({ where: { id, tenantId: assertTenant(tenantId) } });
    if (!row) throw new NotFoundException('Phone number not found in this tenant.');
    return row;
  }
}
