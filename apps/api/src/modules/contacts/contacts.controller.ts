import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, Query } from '@nestjs/common';
import { IsArray, IsEmail, IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { TagsService } from '../tags/tags.service';
import { ContactsService } from './contacts.service';

class UpsertContactDto {
  @IsEmail() @MaxLength(255) email!: string;
  @IsOptional() @IsString() @MaxLength(120) firstName?: string | null;
  @IsOptional() @IsString() @MaxLength(120) lastName?: string | null;
  @IsOptional() @IsObject() customFields?: Record<string, unknown>;
  @IsOptional() @IsUUID() companyId?: string | null;
  @IsOptional() @IsUUID() ownerUserId?: string | null;
  @IsOptional() @IsString() @MaxLength(120) leadSource?: string | null;
  @IsOptional() @IsIn(['lead', 'mql', 'sql', 'customer', 'other']) lifecycleStage?: 'lead' | 'mql' | 'sql' | 'customer' | 'other';
  @IsOptional() @IsString() @MaxLength(40) phone?: string | null;
}

class ImportCsvDto {
  @IsString() csv!: string;
}

class AttachTagsDto {
  @IsArray() @IsUUID(undefined, { each: true }) tagIds!: string[];
}

@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contacts: ContactsService,
    private readonly tags: TagsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('contacts:read')
  list(@CurrentUser() user: AuthUser, @Query('limit') limit?: string) {
    return this.contacts.list(user.tenantId, limit ? Number(limit) : 200);
  }

  @Get('duplicates')
  @Permissions('contacts:read')
  duplicates(@CurrentUser() user: AuthUser) {
    return this.contacts.duplicates(user.tenantId);
  }

  @Post('import')
  @Permissions('contacts:write')
  @HttpCode(200)
  async import(@CurrentUser() user: AuthUser, @Body() dto: ImportCsvDto) {
    const res = await this.contacts.importCsv(user.tenantId, dto.csv);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'contact.import',
      entityType: 'contact', entityId: null, detail: res,
    });
    return res;
  }

  @Post('export')
  @Permissions('contacts:read')
  @Header('content-type', 'text/csv')
  async export(@CurrentUser() user: AuthUser) {
    return this.contacts.exportCsv(user.tenantId);
  }

  @Get(':id')
  @Permissions('contacts:read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.contacts.getById(user.tenantId, id);
  }

  @Get(':id/timeline')
  @Permissions('contacts:read')
  timeline(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query('limit') limit?: string) {
    return this.contacts.timeline(user.tenantId, id, limit ? Number(limit) : 50);
  }

  @Get(':id/tags')
  @Permissions('contacts:read')
  contactTags(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tags.contactTags(user.tenantId, id);
  }

  @Post()
  @Permissions('contacts:write')
  @HttpCode(201)
  async upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertContactDto) {
    const row = await this.contacts.upsert(user.tenantId, dto);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'contact.upsert',
      entityType: 'contact', entityId: row.id, detail: { email: row.email },
    });
    return row;
  }

  @Post(':id/tags')
  @Permissions('contacts:write')
  async attachTags(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AttachTagsDto) {
    const rows = await this.tags.attachToContact(user.tenantId, id, dto.tagIds);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'contact.tag.attach',
      entityType: 'contact', entityId: id, detail: { tagIds: dto.tagIds },
    });
    return rows;
  }

  @Delete(':id/tags/:tagId')
  @Permissions('contacts:write')
  @HttpCode(204)
  async detachTag(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('tagId') tagId: string) {
    await this.tags.detachFromContact(user.tenantId, id, tagId);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'contact.tag.detach',
      entityType: 'contact', entityId: id, detail: { tagId },
    });
  }

  @Delete(':id')
  @Permissions('contacts:delete')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.contacts.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'contact.delete',
      entityType: 'contact', entityId: id, detail: {},
    });
  }
}
