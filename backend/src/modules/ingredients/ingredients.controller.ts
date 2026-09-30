import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorator/current-user.decorator';

@ApiTags('ingredients')
@ApiBearerAuth()
@Controller('restaurants/:restaurantId/ingredients')
@UseGuards(JwtAuthGuard)
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo ingrediente' })
  create(
    @CurrentUser('id') userId: string,
    @Param('restaurantId') restaurantId: string,
    @Body() createIngredientDto: CreateIngredientDto,
  ) {
    return this.ingredientsService.create(
      userId,
      restaurantId,
      createIngredientDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los ingredientes' })
  findAll(
    @CurrentUser('id') userId: string,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.ingredientsService.findAll(userId, restaurantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un ingrediente por ID' })
  findOne(
    @CurrentUser('id') userId: string,
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
  ) {
    return this.ingredientsService.findOne(userId, restaurantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un ingrediente' })
  update(
    @CurrentUser('id') userId: string,
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Body() updateIngredientDto: UpdateIngredientDto,
  ) {
    return this.ingredientsService.update(
      userId,
      restaurantId,
      id,
      updateIngredientDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un ingrediente' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
  ) {
    return this.ingredientsService.remove(userId, restaurantId, id);
  }
}
