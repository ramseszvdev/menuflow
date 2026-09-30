import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentRestaurantId } from '../../common/decorator/current-restaurant.decorator';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

enum DeliveryPlatform {
  UBER = 'uber',
  GLOVO = 'glovo',
}

// Interfaces para tipar las entradas/salidas y eliminar todos los 'any'
export class SyncMenuDto {
  @IsArray()
  @IsEnum(DeliveryPlatform, { each: true })
  @Type(() => String)
  platforms!: string[];
}

export class ConnectPlatformDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Type(() => String)
  storeId!: string;
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Type(() => String)
  accessToken!: string;
}

export interface SyncMenuResults {
  uber?: unknown;
  glovo?: unknown;
}

@ApiTags('delivery')
@ApiBearerAuth()
@Controller('delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('sync/:menuId')
  @ApiOperation({ summary: 'Sincronizar menú con Uber Eats y Glovo' })
  async syncMenu(
    @CurrentRestaurantId() restaurantId: string,
    @Param('menuId') menuId: string,
    @Body() dto: SyncMenuDto,
  ) {
    const results: SyncMenuResults = {};

    if (dto.platforms?.includes('uber')) {
      results.uber = await this.deliveryService.syncMenuToUberEats(
        restaurantId,
        menuId,
      );
    }

    if (dto.platforms?.includes('glovo')) {
      results.glovo = await this.deliveryService.syncMenuToGlovo(
        restaurantId,
        menuId,
      );
    }

    return results;
  }

  @Post('connect/uber')
  @ApiOperation({ summary: 'Conectar con Uber Eats' })
  async connectUber(
    @CurrentUser('id') userId: string,
    @CurrentRestaurantId() restaurantId: string,
    @Body() dto: ConnectPlatformDto,
  ) {
    return this.deliveryService.connectUberEats(
      userId,
      restaurantId,
      dto.storeId,
      dto.accessToken,
    );
  }

  @Post('connect/glovo')
  @ApiOperation({ summary: 'Conectar con Glovo' })
  async connectGlovo(
    @CurrentUser('id') userId: string,
    @CurrentRestaurantId() restaurantId: string,
    @Body() dto: ConnectPlatformDto,
  ) {
    return this.deliveryService.connectGlovo(
      userId,
      restaurantId,
      dto.storeId,
      dto.accessToken,
    );
  }

  @Delete('disconnect/:platform')
  @ApiOperation({ summary: 'Desconectar plataforma' })
  async disconnectDelivery(
    @CurrentUser('id') userId: string,
    @CurrentRestaurantId() restaurantId: string,
    @Param('platform') platform: 'uber' | 'glovo',
  ) {
    return this.deliveryService.disconnectDelivery(
      userId,
      restaurantId,
      platform,
    );
  }

  @Get('status')
  @ApiOperation({ summary: 'Estado de conexiones' })
  async getDeliveryStatus(@CurrentRestaurantId() restaurantId: string) {
    return this.deliveryService.getDeliveryStatus(restaurantId);
  }
}
