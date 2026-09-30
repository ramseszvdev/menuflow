import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CurrentUser } from '../../common/decorator/current-user.decorator';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Crear sesión de checkout' })
  async createCheckoutSession(
    @CurrentUser('id') userId: string,
    @CurrentUser('restaurantId') restaurantId: string,
    @Body() createCheckoutDto: CreateCheckoutDto,
  ) {
    return this.paymentsService.createCheckoutSession(
      userId,
      restaurantId,
      createCheckoutDto,
    );
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Obtener suscripción actual' })
  async getSubscription(
    @CurrentUser('restaurantId') restaurantId: string,
  ): Promise<unknown> {
    if (!restaurantId) {
      throw new BadRequestException(
        'El usuario no tiene un restaurante asociado',
      );
    }

    return this.paymentsService.getSubscription(
      restaurantId,
    ) as Promise<unknown>;
  }

  @Delete('subscription')
  @ApiOperation({ summary: 'Cancelar suscripción' })
  async cancelSubscription(
    @CurrentUser('id') userId: string,
    @CurrentUser('restaurantId') restaurantId: string,
  ) {
    if (!restaurantId) {
      throw new BadRequestException(
        'El usuario no tiene un restaurante asociado',
      );
    }

    return this.paymentsService.cancelSubscription(userId, restaurantId);
  }

  @Get('billing-history')
  @ApiOperation({ summary: 'Obtener historial de facturación' })
  async getBillingHistory(
    @CurrentUser('restaurantId') restaurantId: string,
  ): Promise<unknown> {
    if (!restaurantId) {
      throw new BadRequestException(
        'El usuario no tiene un restaurante asociado',
      );
    }

    return this.paymentsService.getBillingHistory(
      restaurantId,
    ) as Promise<unknown>;
  }

  @Post('portal')
  @ApiOperation({ summary: 'Crear sesión del portal de facturación' })
  async createPortalSession(
    @CurrentUser('id') userId: string,
    @CurrentUser('restaurantId') restaurantId: string,
  ) {
    if (!restaurantId) {
      throw new BadRequestException(
        'El usuario no tiene un restaurante asociado',
      );
    }

    return this.paymentsService.createPortalSession(userId, restaurantId);
  }
}
