import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RestaurantsService } from './restaurant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentRestaurantId } from '../../common/decorator/current-restaurant.decorator';

@ApiTags('restaurants')
@ApiBearerAuth()
@Controller('restaurants')
@UseGuards(JwtAuthGuard)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener información del restaurante actual' })
  getProfile(@CurrentRestaurantId() restaurantId: string) {
    return this.restaurantsService.findById(restaurantId);
  }
}
