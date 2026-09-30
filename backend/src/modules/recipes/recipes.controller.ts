import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentRestaurantId } from '../../common/decorator/current-restaurant.decorator';
import { CurrentUser } from '../../common/decorator/current-user.decorator';

@ApiTags('recipes')
@ApiBearerAuth()
@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva receta' })
  async create(
    @CurrentRestaurantId() restaurantId: string,
    @Body() dto: CreateRecipeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.recipesService.create(userId, restaurantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las recetas del restaurante' })
  findAll(
    @CurrentRestaurantId() restaurantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.recipesService.findAll(userId, restaurantId);
  }
}
