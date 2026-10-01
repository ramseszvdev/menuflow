import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    restaurantId: string,
    createRecipeDto: CreateRecipeDto,
  ) {
    await this.validateRestaurantAccess(userId, restaurantId);

    const { ingredients = [], ...recipeData } = createRecipeDto;
    const normalizedIngredients = ingredients.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: item.quantity ?? 0,
    }));

    // Calcular el costo total de la receta
    const totalCost = await this.calculateRecipeCost(
      restaurantId,
      normalizedIngredients,
    );
    const sellingPrice = recipeData.sellingPrice ?? 0;

    // Calcular el margen de beneficio
    const profitMargin =
      totalCost > 0 && sellingPrice > 0
        ? ((sellingPrice - totalCost) / sellingPrice) * 100
        : 0;

    return this.prisma.$transaction(async (tx) => {
      return tx.recipe.create({
        data: {
          ...recipeData,
          profitMargin,
          restaurantId,
          ingredients: {
            create: ingredients.map((item) => ({
              ingredientId: item.ingredientId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });
    });
  }

  async findAll(userId: string, restaurantId: string) {
    await this.validateRestaurantAccess(userId, restaurantId);

    return this.prisma.recipe.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        menuRecipes: {
          include: {
            menu: {
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

    const recipe = await this.prisma.recipe.findFirst({
      where: { id, restaurantId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        menuRecipes: {
          include: {
            menu: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException(`Receta con ID ${id} no encontrada`);
    }

    return recipe;
  }

  async update(
    userId: string,
    restaurantId: string,
    id: string,
    updateRecipeDto: UpdateRecipeDto,
  ) {
    await this.validateRestaurantAccess(userId, restaurantId);

    const recipe = await this.prisma.recipe.findFirst({
      where: { id, restaurantId },
    });

    if (!recipe) {
      throw new NotFoundException(`Receta con ID ${id} no encontrada`);
    }

    const { ingredients, ...recipeData } = updateRecipeDto;

    // Actualizar ingredientes si se proporcionan
    if (ingredients && ingredients.length > 0) {
      // Calcular nuevo costo
      const totalCost = await this.calculateRecipeCost(
        restaurantId,
        ingredients,
      );
      const sellingPrice = recipeData.sellingPrice ?? recipe.sellingPrice;
      const profitMargin =
        totalCost > 0 && sellingPrice > 0
          ? ((sellingPrice - totalCost) / sellingPrice) * 100
          : 0;

      // Actualizar en transacción
      return this.prisma.$transaction(async (tx) => {
        // Eliminar ingredientes existentes
        await tx.recipeIngredient.deleteMany({
          where: { recipeId: id },
        });

        // Actualizar receta con nuevos ingredientes
        return tx.recipe.update({
          where: { id },
          data: {
            ...recipeData,
            profitMargin,
            ingredients: {
              create: ingredients.map((item) => ({
                ingredientId: item.ingredientId,
                quantity: item.quantity,
              })),
            },
          },
          include: {
            ingredients: {
              include: {
                ingredient: true,
              },
            },
          },
        });
      });
    }

    // Si no hay cambios en los ingredientes pero sí se actualizó el precio de venta
    let profitMargin = recipe.profitMargin;
    if (recipeData.sellingPrice !== undefined && recipeData.sellingPrice > 0) {
      const currentIngredients = await this.prisma.recipeIngredient.findMany({
        where: { recipeId: id },
      });
      const totalCost = await this.calculateRecipeCost(
        restaurantId,
        currentIngredients,
      );
      profitMargin =
        totalCost > 0
          ? ((recipeData.sellingPrice - totalCost) / recipeData.sellingPrice) *
            100
          : 0;
    }

    // Si no se actualizan ingredientes, solo actualizar datos básicos
    return this.prisma.recipe.update({
      where: { id },
      data: {
        ...recipeData,
        profitMargin,
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });
  }

  async remove(userId: string, restaurantId: string, id: string) {
    await this.validateRestaurantAccess(userId, restaurantId);

    const recipe = await this.prisma.recipe.findFirst({
      where: { id, restaurantId },
      include: {
        menuRecipes: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException(`Receta con ID ${id} no encontrada`);
    }

    if (recipe.menuRecipes.length > 0) {
      throw new ForbiddenException(
        `No se puede eliminar la receta porque está siendo usada en ${recipe.menuRecipes.length} menú(es)`,
      );
    }

    // Las FKs recipe_ingredients_recipeId_fkey y menu_recipes son RESTRICT:
    // hay que borrar primero las filas hijas (recipe_ingredients) y luego
    // la receta, en una transacción para no dejar datos inconsistentes.
    return this.prisma.$transaction(async (tx) => {
      await tx.recipeIngredient.deleteMany({
        where: { recipeId: id },
      });

      return tx.recipe.delete({
        where: { id },
      });
    });
  }

  // Calcular costo de una receta basado en sus ingredientes
  private async calculateRecipeCost(
    restaurantId: string,
    ingredients: Array<{ ingredientId: string; quantity: number }>,
  ): Promise<number> {
    if (ingredients.length === 0) {
      return 0;
    }

    const ingredientIds = [...new Set(ingredients.map((item) => item.ingredientId))];
    const records = await this.prisma.ingredient.findMany({
      where: {
        id: { in: ingredientIds },
        restaurantId,
      },
      select: {
        id: true,
        costPerUnit: true,
      },
    });
    const ingredientsById = new Map(
      records.map((ingredient) => [ingredient.id, ingredient]),
    );

    let totalCost = 0;
    for (const item of ingredients) {
      const ingredient = ingredientsById.get(item.ingredientId);

      if (!ingredient) {
        throw new NotFoundException(
          `Ingrediente ${item.ingredientId} no encontrado`,
        );
      }

      totalCost += ingredient.costPerUnit * item.quantity;
    }

    return totalCost;
  }

  private async validateRestaurantAccess(
    userId: string,
    restaurantId: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { restaurantId: true },
    });

    if (!user || user.restaurantId !== restaurantId) {
      throw new ForbiddenException('No tienes acceso a este restaurante');
    }

    return true;
  }
}
