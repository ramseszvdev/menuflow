import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorator/public.decorator';
import Stripe from 'stripe';

@Controller('payments/webhook')
export class WebhookController {
  private stripe: Stripe;

  constructor(
    private paymentsService: PaymentsService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('stripe.secretKey'),
      {},
    );
  }

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.getOrThrow<string>(
      'stripe.webhookSecret',
    );

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );
    } catch (err: unknown) {
      console.error(
        `⚠️  Webhook signature verification failed.`,
        (err as Error).message,
      );
      throw new BadRequestException('Firma de webhook inválida');
    }

    return this.paymentsService.handleWebhook(event);
  }
}
