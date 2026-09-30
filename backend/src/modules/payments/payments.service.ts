import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import { CreateCheckoutDto, PlanType } from './dto/create-checkout.dto';
import { Invoice, Subscription, SubscriptionStatus } from '@prisma/client';
import { buildCheckoutReturnUrls } from './checkout-return-url';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('stripe.secretKey'),
    );
  }

  getPriceId(plan: PlanType): string {
    const priceMap: Record<PlanType, string> = {
      [PlanType.BASIC]:
        this.configService.get<string>('stripe.prices.basic') ?? '',
      [PlanType.PRO]: this.configService.get<string>('stripe.prices.pro') ?? '',
      [PlanType.ENTERPRISE]:
        this.configService.get<string>('stripe.prices.enterprise') ?? '',
    };

    const priceId = priceMap[plan];
    if (!priceId) {
      throw new BadRequestException(`Plan ${plan} no configurado`);
    }

    return priceId;
  }

  async createCheckoutSession(
    userId: string,
    restaurantId: string,
    createCheckoutDto: CreateCheckoutDto,
  ) {
    const { plan, successUrl, cancelUrl } = createCheckoutDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true },
    });

    if (!user || user.restaurantId !== restaurantId) {
      throw new ForbiddenException('No tienes acceso a este restaurante');
    }

    const priceId = this.getPriceId(plan);

    const frontendUrl = this.configService.get<string>('frontend.url') ?? '';
    const { success, cancel } = buildCheckoutReturnUrls(
      frontendUrl,
      successUrl,
      cancelUrl,
    );

    // Verificar si ya tiene una suscripción activa
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: {
        restaurantId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existingSubscription) {
      throw new BadRequestException('Ya tienes una suscripción activa');
    }

    // Crear o recuperar el cliente Stripe
    let customerId: string;
    if (user.stripeCustomerId) {
      customerId = user.stripeCustomerId;
    } else {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
          restaurantId,
        },
      });
      customerId = customer.id;

      // Guardar el customerId en la base de datos
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Crear la sesión de checkout
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success,
      cancel_url: cancel,
      metadata: {
        userId,
        restaurantId,
        plan,
      },
      subscription_data: {
        metadata: {
          userId,
          restaurantId,
          plan,
        },
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        if (this.isStripeCheckoutSession(event.data.object)) {
          await this.handleCheckoutSessionCompleted(event.data.object);
        }
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        if (this.isStripeSubscription(event.data.object)) {
          await this.handleSubscriptionUpdated(event.data.object);
        }
        break;

      case 'customer.subscription.deleted':
        if (this.isStripeSubscription(event.data.object)) {
          await this.handleSubscriptionDeleted(event.data.object);
        }
        break;

      case 'invoice.payment_succeeded':
        if (this.isStripeInvoice(event.data.object)) {
          await this.handleInvoicePaymentSucceeded(event.data.object);
        }
        break;

      case 'invoice.payment_failed':
        if (this.isStripeInvoice(event.data.object)) {
          await this.handleInvoicePaymentFailed(event.data.object);
        }
        break;

      default:
        break;
    }

    return { received: true };
  }

  private isStripeCheckoutSession(
    object: Stripe.Event.Data.Object,
  ): object is Stripe.Checkout.Session {
    return (
      typeof object === 'object' &&
      object !== null &&
      'metadata' in object &&
      'subscription' in object
    );
  }

  private isStripeSubscription(
    object: Stripe.Event.Data.Object,
  ): object is Stripe.Subscription {
    return (
      typeof object === 'object' &&
      object !== null &&
      typeof (object as Stripe.Subscription).id === 'string' &&
      typeof (object as Stripe.Subscription).status === 'string'
    );
  }

  private isStripeInvoice(
    object: Stripe.Event.Data.Object,
  ): object is Stripe.Invoice {
    return (
      typeof object === 'object' &&
      object !== null &&
      typeof (object as Stripe.Invoice).id === 'string' &&
      typeof (object as Stripe.Invoice).amount_paid === 'number'
    );
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    if (!session.metadata) {
      throw new BadRequestException(
        'La sesión de checkout no contiene metadata.',
      );
    }

    const { userId, restaurantId, plan } = session.metadata;

    if (!userId || !restaurantId) {
      console.error('Metadata missing in checkout session', session.id);
      return;
    }

    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    const stripeCustomerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    if (!stripeSubscriptionId || !stripeCustomerId) {
      console.error(
        'Suscripción o cliente de Stripe no disponible en la sesión de checkout',
        session.id,
      );
      return;
    }

    // Registrar la suscripción
    await this.prisma.subscription.create({
      data: {
        stripeSubscriptionId,
        stripeCustomerId,
        userId,
        restaurantId,
        plan: plan,
        status: SubscriptionStatus.ACTIVE,
        cancelledAt: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      },
    });

    // Actualizar el plan del restaurante
    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { plan },
    });

    console.log(`✅ Suscripción creada para restaurante ${restaurantId}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const existing = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!existing) return;

    const isStripeActive = subscription.status === 'active';

    // Extraer el período desde el primer ítem de la suscripción
    const item = subscription.items.data[0];
    const startTimestamp =
      item?.current_period_start ?? Math.floor(Date.now() / 1000);
    const endTimestamp =
      item?.current_period_end ??
      Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    await this.prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: isStripeActive
          ? SubscriptionStatus.ACTIVE
          : SubscriptionStatus.INACTIVE,
        currentPeriodStart: new Date(startTimestamp * 1000),
        currentPeriodEnd: new Date(endTimestamp * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    if (isStripeActive) {
      await this.prisma.restaurant.update({
        where: { id: existing.restaurantId },
        data: { plan: existing.plan },
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const existing = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!existing) return;

    await this.prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // Cambiar a plan gratuito
    await this.prisma.restaurant.update({
      where: { id: existing.restaurantId },
      data: { plan: 'FREE' },
    });
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId =
      typeof invoice.parent === 'string'
        ? invoice.parent
        : (invoice.lines.data[0]?.subscription as string | undefined);

    if (!subscriptionId) return;

    await this.prisma.invoice.create({
      data: {
        stripeInvoiceId: invoice.id,
        subscriptionId,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: 'PAID',
        invoiceUrl: invoice.invoice_pdf ?? null,
        paidAt: new Date(),
      },
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const lineSubscription = invoice.lines?.data[0]?.subscription;

    const subscriptionId =
      typeof invoice.parent === 'string'
        ? invoice.parent
        : typeof lineSubscription === 'string'
          ? lineSubscription
          : lineSubscription?.id;

    if (!subscriptionId) return;

    await this.prisma.invoice.create({
      data: {
        stripeInvoiceId: invoice.id,
        subscriptionId,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        status: 'FAILED',
        paidAt: null,
      },
    });

    // 2. Tipar la respuesta para evitar 'error type' en Prisma
    const subscription = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (subscription) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.PAST_DUE },
      });
    }
  }

  async getSubscription(restaurantId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        restaurantId,
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAST_DUE,
            SubscriptionStatus.TRAILING,
          ],
        },
      },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return subscription;
  }

  async cancelSubscription(userId: string, restaurantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        restaurantId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!subscription) {
      throw new NotFoundException('No hay suscripción activa');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { restaurantId: true },
    });

    if (!user || user.restaurantId !== restaurantId) {
      throw new ForbiddenException('No tienes acceso a este restaurante');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new NotFoundException(
        'El restaurante no tiene una suscripción activa de Stripe.',
      );
    }

    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });

    return { message: 'Suscripción cancelada al final del período actual' };
  }

  async getBillingHistory(restaurantId: string): Promise<Invoice[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        subscription: {
          restaurantId,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return invoices;
  }

  async createPortalSession(userId: string, restaurantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId || user.restaurantId !== restaurantId) {
      throw new NotFoundException('Cliente Stripe no encontrado');
    }

    const frontendUrl = this.configService.get<string>('frontend.url') ?? '';

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${frontendUrl}/dashboard/billing`,
    });

    return { url: session.url };
  }
}
