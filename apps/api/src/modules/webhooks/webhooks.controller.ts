import { Body, Controller, Headers, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SkipCsrf } from '../../common/decorators/skip-csrf.decorator';
import { WebhooksService } from './webhooks.service';
import { TwilioWebhooksService } from './twilio-webhooks.service';
import { StripeWebhooksService } from './stripe-webhooks.service';

@Controller('webhooks')
@Public()
@SkipCsrf()
export class WebhooksController {
  constructor(
    private readonly webhooks: WebhooksService,
    private readonly twilioWebhooks: TwilioWebhooksService,
    private readonly stripeWebhooks: StripeWebhooksService,
  ) {}

  @Post('events')
  @HttpCode(200)
  async events(
    @Body() body: unknown,
    @Req() req: Request,
    @Headers('x-twilio-email-event-webhook-signature') signature: string,
    @Headers('x-twilio-email-event-webhook-timestamp') timestamp: string,
  ) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ?? JSON.stringify(body);
    const events = Array.isArray(body) ? body : [];
    const result = await this.webhooks.ingest({ rawBody: raw, signature, timestamp, events });
    return { ok: true, ...result };
  }

  @Post('twilio/sms')
  @HttpCode(200)
  async twilioSms(
    @Body() body: Record<string, string>,
    @Req() req: Request,
    @Headers('x-twilio-signature') signature: string,
  ) {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    await this.twilioWebhooks.ingestSms(url, body, signature ?? '');
    return { ok: true };
  }

  @Post('twilio/voice')
  @HttpCode(200)
  async twilioVoice(
    @Body() body: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-twilio-signature') signature: string,
  ) {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const twiml = await this.twilioWebhooks.ingestVoice(url, body, signature ?? '');
    res.type('text/xml').send(twiml);
  }

  @Post('twilio/voice/status')
  @HttpCode(200)
  async twilioVoiceStatus(
    @Body() body: Record<string, string>,
    @Req() req: Request,
    @Headers('x-twilio-signature') signature: string,
  ) {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    await this.twilioWebhooks.ingestVoiceStatus(url, body, signature ?? '');
    return { ok: true };
  }

  @Post('stripe')
  @HttpCode(200)
  async stripe(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ?? '';
    return this.stripeWebhooks.ingest(raw, signature ?? '');
  }
}
