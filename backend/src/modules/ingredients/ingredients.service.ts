import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    restaurantId: string,
    createIngredientDto: CreateIngredientDto,
  ) {
    // Verificar que el restaurante existe y pertenece al usuario
    await this.validateRestaurantAccess(userId, restaurantId);

    return this.prisma.ingredient.create({
      data: {
        ...createIngredientDto,
        restaurantId,
      },
    });
  }

  async findAll(userId: string, restaurantId: string) {
    await this.validateRestaurantAccess(userId, restaurantId);

    return this.prisma.ingredient.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
      include: {
        recipeIngredients: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(userId: string, restaurantId: string, id: string) {
    await this.validateRestaurantAccess(userId, restaurantId);

    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, restaurantId },
      include: {
        recipeIngredients: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
                sellingPrice: true,
              },
            },
          },
        },
      },
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingrediente con ID ${id} no encontrado`);
    }

    return ingredient;
  }

  async update(
    userId: string,
    restaurantId: string,
    id: string,
    updateIngredientDto: UpdateIngredientDto,
  ) {
    await this.validateRestaurantAccess(userId, restaurantId);

    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, restaurantId },
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingrediente con ID ${id} no encontrado`);
    }

    return this.prisma.ingredient.update({
      where: { id },
      data: updateIngredientDto,
    });
  }

  async remove(userId: string, restaurantId: string, id: string) {
    await this.validateRestaurantAccess(userId, restaurantId);

    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, restaurantId },
      include: {
        recipeIngredients: true,
      },
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingrediente con ID ${id} no encontrado`);
    }

    // Verificar si el ingrediente está siendo usado en recetas
    if (ingredient.recipeIngredients.length > 0) {
      throw new ForbiddenException(
        `No se puede eliminar el ingrediente porque está siendo usado en ${ingredient.recipeIngredients.length} receta(s)`,
      );
    }

    return this.prisma.ingredient.delete({
      where: { id },
    });
  }

  // Método auxiliar para validar acceso al restaurante
  private async validateRestaurantAccess(userId: string, restaurantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { restaurantId: true },
    });

    if (!user || user.restaurantId !== restaurantId) {
      throw new ForbiddenException('No tienes acceso a este restaurante');
    }

    return true;
  }

  // Método para actualizar stock de múltiples ingredientes (usado en pedidos).
  // Se ejecuta dentro de una transacción atómica: si una actualización falla,
  // se revierten todas para no dejar el inventario en estado inconsistente.
  async updateStock(
    restaurantId: string,
    updates: Array<{ id: string; quantity: number }>,
  ) {
    return this.prisma.$transaction(
      updates.map(({ id, quantity }) =>
        this.prisma.ingredient.update({
          where: { id, restaurantId },
          data: {
            stock: {
              increment: quantity, // positivo para agregar, negativo para restar
            },
          },
        }),
      ),
    );
  }
}
