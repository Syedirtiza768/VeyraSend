import { Body, Controller, ForbiddenException, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { SkipCsrf } from '../../common/decorators/skip-csrf.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth.types';
import { ConfigService } from '../../config/config.service';
import { InboundService } from './inbound.service';

@Controller('webhooks/inbound')
@Public()
@SkipCsrf()
export class InboundWebhookController {
  constructor(
    private readonly inbound: InboundService,
    private readonly config: ConfigService,
  ) {}

  /** SendGrid Inbound Parse target. Requires shared secret when configured. */
  @Post()
  @HttpCode(200)
  async ingest(@Query('secret') secret: string | undefined, @Body() body: Record<string, unknown>) {
    const expected = this.config.all.sendgrid.inboundParseSecret;
    if (expected && secret !== expected) {
      throw new ForbiddenException('Invalid inbound parse secret.');
    }
    const from = String(body.from ?? body.from_email ?? '');
    const to = String(body.to ?? body.to_email ?? '');
    const subject = String(body.subject ?? body.header_subject ?? '(no subject)');
    const text = body.text ? String(body.text) : null;
    const html = body.html ? String(body.html) : null;
    const attachments = Array.isArray(body.attachments) ? (body.attachments as never) : undefined;
    const res = await this.inbound.ingest({ from, to, subject, text, html, attachments });
    return { ok: true, ...res };
  }
}

@Controller('inbound')
export class InboundController {
  constructor(private readonly inbound: InboundService) {}

  @Get('threads')
  @Permissions('inbound:read')
  threads(@CurrentUser() user: AuthUser) {
    return this.inbound.listThreads(user.tenantId);
  }

  @Get('threads/:id/messages')
  @Permissions('inbound:read')
  messages(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query('q') _q?: string) {
    return this.inbound.threadMessages(user.tenantId, id);
  }
}
