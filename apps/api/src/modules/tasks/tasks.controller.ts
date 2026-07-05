import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { TasksService } from './tasks.service';

class CreateTaskDto {
  @IsString() @MaxLength(255) title!: string;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsString() dueAt?: string | null;
  @IsOptional() @IsUUID() assigneeUserId?: string | null;
  @IsIn(['contact', 'deal', 'company']) entityType!: 'contact' | 'deal' | 'company';
  @IsUUID() entityId!: string;
}

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('tasks:read')
  list(
    @CurrentUser() user: AuthUser,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('assigneeUserId') assigneeUserId?: string,
    @Query('status') status?: string,
  ) {
    return this.tasks.list(user.tenantId, { entityType, entityId, assigneeUserId, status });
  }

  @Post()
  @Permissions('tasks:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    const row = await this.tasks.create(user.tenantId, dto);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'task.create',
      entityType: 'task', entityId: row.id,
      detail: { entityType: row.entityType, entityId: row.entityId, title: row.title },
    });
    return row;
  }

  @Patch(':id')
  @Permissions('tasks:write')
  async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: Partial<CreateTaskDto & { status?: 'open' | 'done' }>) {
    const row = await this.tasks.update(user.tenantId, id, dto);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'task.update',
      entityType: 'task', entityId: id, detail: {},
    });
    return row;
  }

  @Delete(':id')
  @Permissions('tasks:delete')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.tasks.remove(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'task.delete',
      entityType: 'task', entityId: id, detail: {},
    });
  }
}
