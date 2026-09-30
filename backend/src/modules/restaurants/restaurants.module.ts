import { Module } from '@nestjs/common';
import { RestaurantsService } from './restaurant.service';
import { RestaurantsController } from './restaurant.controller';

@Module({
  controllers: [RestaurantsController],
  providers: [RestaurantsService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
