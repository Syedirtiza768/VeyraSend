import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { WorkflowDefinition } from '@veyrasend/db';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { AuditService } from '../audit/audit.service';
import { WorkflowsService } from './workflows.service';

class CreateWorkflowDto {
  @IsString() @MaxLength(120) name!: string;
  @IsObject() definition!: WorkflowDefinition;
}

class DraftDto {
  @IsObject() definition!: WorkflowDefinition;
}

class TestRunDto {
  @IsUUID() contactId!: string;
}

@Controller('workflows')
export class WorkflowsController {
  constructor(
    private readonly workflows: WorkflowsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Permissions('workflows:read')
  list(@CurrentUser() user: AuthUser) {
    return this.workflows.list(user.tenantId);
  }

  @Get('runs/:runId/steps')
  @Permissions('workflows:read')
  runSteps(@CurrentUser() user: AuthUser, @Param('runId') runId: string) {
    return this.workflows.runSteps(user.tenantId, runId);
  }

  @Get(':id')
  @Permissions('workflows:read')
  getById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.workflows.getById(user.tenantId, id);
  }

  @Get(':id/runs')
  @Permissions('workflows:read')
  runs(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    return this.workflows.listRuns(user.tenantId, id, status);
  }

  @Post()
  @Permissions('workflows:write')
  @HttpCode(201)
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkflowDto) {
    const row = await this.workflows.create(user.tenantId, dto.name, dto.definition, user.userId);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'workflow.create',
      entityType: 'workflow', entityId: row.id, detail: { name: row.name },
    });
    return row;
  }

  @Put(':id/draft')
  @Permissions('workflows:write')
  async updateDraft(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: DraftDto) {
    const row = await this.workflows.updateDraft(user.tenantId, id, dto.definition, user.userId);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'workflow.draft',
      entityType: 'workflow', entityId: id, detail: {},
    });
    return row;
  }

  @Post(':id/publish')
  @Permissions('workflows:publish')
  async publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const row = await this.workflows.publish(user.tenantId, id);
    await this.audit.record({
      tenantId: user.tenantId, actorUserId: user.userId, action: 'workflow.publish',
      entityType: 'workflow', entityId: id, detail: { versionId: row.currentVersionId },
    });
    return row;
  }

  @Post(':id/pause')
  @Permissions('workflows:write')
  async pause(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.workflows.setPaused(user.tenantId, id, true);
  }

  @Post(':id/resume')
  @Permissions('workflows:write')
  async resume(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.workflows.setPaused(user.tenantId, id, false);
  }

  @Post(':id/test-run')
  @Permissions('workflows:write')
  async testRun(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: TestRunDto) {
    return this.workflows.testRun(user.tenantId, id, dto.contactId);
  }
}
