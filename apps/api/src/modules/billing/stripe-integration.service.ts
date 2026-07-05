import { Injectable } from '@nestjs/common';
import { StripeClient, getStripeClient } from '@veyrasend/stripe';

@Injectable()
export class StripeIntegrationService {
  private readonly client: StripeClient;

  constructor() {
    this.client = getStripeClient();
  }

  get stripe(): StripeClient {
    return this.client;
  }
}
