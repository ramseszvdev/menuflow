import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

interface Ingredient {
  id: string;
  name: string;
  costPerUnit: number;
}
interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  ingredient?: Ingredient;
}
interface Recipe {
  id: string;
  name: string;
  sellingPrice: number;
  totalCost?: number;
  profitMargin?: number | null;
  ingredients?: RecipeIngredient[];
}
interface MenuRecipe {
  menuId: string;
  recipeId: string;
  recipe: Recipe;
}

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    restaurantId: string,
    createMenuDto: CreateMenuDto,
  ) {
    await this.validateRestaurantAccess(userId, restaurantId);

    const { recipes, ...menuData } = createMenuDto;

    // 1. Filtrar explícitamente y mapear asegurando un arreglo de string pura
    if (recipes && recipes.length > 0) {
      const recipeIds: string[] = recipes
        .map((r) => r.recipeId)
        .filter((id): id is string => Boolean(id));

      const existingRecipes = await this.prisma.recipe.findMany({
        where: {
          id: { in: recipeIds },
          restaurantId,
        },
        select: { id: true },
      });

      if (existingRecipes.length !== recipeIds.length) {
        throw new NotFoundException(
          'Una o más recetas no existen en este restaurante',
        );
      }
    }

    const createdMenu = await this.prisma.$transaction(async (prisma) => {
      return prisma.menu.create({
        data: {
          ...menuData,
          restaurantId,
          recipes: recipes
            ? {
                create: recipes.map((item) => ({
                  recipeId: item.recipeId,
                  order: item.order || 0,
                })),
              }
            : undefined,
        },
        include: {
          recipes: {
            include: {
              recipe: {
                include: {
                  ingredients: {
                    include: {
                      ingredient: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    });

    return this.enrichMenuWithCosts(createdMenu);
  }

  async findAll(userId: string, restaurantId: string) {
    await this.validateRestaurantAccess(userId, restaurantId);

    const menus = await this.prisma.menu.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      include: {
        recipes: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return menus.map((menu) => this.enrichMenuWithCosts(menu));
  }

  async findOne(userId: string, restaurantId: string, id: string) {
    await this.validateRestaurantAccess(userId, restaurantId);

    const menu = await this.prisma.menu.findFirst({
      where: { id, restaurantId },
      include: {
        recipes: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException(`Menú con ID ${id} no encontrado`);
    }

    return this.enrichMenuWithCosts(menu);
  }

  async update(
    userId: string,
    restaurantId: string,
    id: string,
    updateMenuDto: UpdateMenuDto,
  ) {
    await this.validateRestaurantAccess(userId, restaurantId);

    const menu = await this.prisma.menu.findFirst({
      where: { id, restaurantId },
    });

    if (!menu) {
      throw new NotFoundException(`Menú con ID ${id} no encontrado`);
    }

    const { recipes, ...menuData } = updateMenuDto;

    if (recipes) {
      const updatedMenu = await this.prisma.$transaction(async (prisma) => {
        const recipeIds = [...new Set(recipes.map((item) => item.recipeId))];
        const existingRecipes = await prisma.recipe.findMany({
          where: {
            id: { in: recipeIds },
            restaurantId,
          },
          select: { id: true },
        });

        if (existingRecipes.length !== recipeIds.length) {
          throw new NotFoundException(
            'Una o más recetas no existen en este restaurante',
          );
        }

        // Eliminar relaciones existentes
        await prisma.menuRecipe.deleteMany({
          where: { menuId: id },
        });

        // Crear nuevas relaciones
        return prisma.menu.update({
          where: { id },
          data: {
            ...menuData,
            recipes: {
              create: recipes.map((item) => ({
                recipeId: item.recipeId,
                order: item.order || 0,
              })),
            },
          },
          include: {
            recipes: {
              include: {
                recipe: {
                  include: {
                    ingredients: {
                      include: {
                        ingredient: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        });
      });

      return this.enrichMenuWithCosts(updatedMenu);
    }

    // Si no se actualizan recetas, solo actualizar datos básicos
    const updatedMenu = await this.prisma.menu.update({
      where: { id },
      data: menuData,
      include: {
        recipes: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return this.enrichMenuWithCosts(updatedMenu);
  }

  async remove(userId: string, restaurantId: string, id: string) {
    await this.validateRestaurantAccess(userId, restaurantId);

    const menu = await this.prisma.menu.findFirst({
      where: { id, restaurantId },
    });

    if (!menu) {
      throw new NotFoundException(`Menú con ID ${id} no encontrado`);
    }

    // La FK menu_recipes_menuId_fkey es RESTRICT: hay que borrar primero
    // las filas hijas (menu_recipes) y luego el menú, en una transacción.
    return this.prisma.$transaction(async (prisma) => {
      await prisma.menuRecipe.deleteMany({
        where: { menuId: id },
      });

      return prisma.menu.delete({
        where: { id },
      });
    });
  }

  // Método para clonar un menú
  async clone(
    userId: string,
    restaurantId: string,
    id: string,
    newName: string,
  ) {
    const originalMenu = await this.findOne(userId, restaurantId, id);

    return this.create(userId, restaurantId, {
      name: newName || `${String(originalMenu.name)} (Copia)`,
      description: originalMenu.description,
      validFrom: new Date().toISOString(),
      validTo: originalMenu.validTo
        ? new Date(originalMenu.validTo).toISOString()
        : undefined,
      recipes: Array.isArray(originalMenu.recipes)
        ? originalMenu.recipes.map(
            (mr: MenuRecipe, index: number) => ({
              recipeId: mr.recipeId,
              order: index,
            }),
          )
        : [],
    });
  }

  // Enriquecer el menú con cálculos de costos y márgenes
  private enrichMenuWithCosts<T extends { recipes?: MenuRecipe[] }>(menu: T) {
    let totalCost = 0;
    let totalSellingPrice = 0;

    if (
      menu.recipes &&
      Array.isArray(menu.recipes) &&
      menu.recipes.length > 0
    ) {
      menu.recipes.forEach((menuRecipe: MenuRecipe) => {
        const recipe = menuRecipe.recipe;
        let recipeCost = 0;

        if (recipe && Array.isArray(recipe.ingredients)) {
          recipe.ingredients.forEach((ri) => {
            const cost = Number(ri.ingredient?.costPerUnit ?? 0);
            const quantity = Number(ri.quantity ?? 0);
            recipeCost += cost * quantity;
          });
        }

        if (recipe) {
          const sellingPrice = Number(recipe.sellingPrice ?? 0);

          recipe.totalCost = parseFloat(recipeCost.toFixed(2));
          recipe.profitMargin =
            sellingPrice > 0
              ? parseFloat(
                  (((sellingPrice - recipeCost) / sellingPrice) * 100).toFixed(
                    1,
                  ),
                )
              : 0;

          totalCost += recipeCost;
          totalSellingPrice += sellingPrice;
        }
      });
    }

    return {
      ...menu,
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalSellingPrice: parseFloat(totalSellingPrice.toFixed(2)),
      totalProfit: parseFloat((totalSellingPrice - totalCost).toFixed(2)),
      averageProfitMargin:
        totalSellingPrice > 0
          ? parseFloat(
              (
                ((totalSellingPrice - totalCost) / totalSellingPrice) *
                100
              ).toFixed(1),
            )
          : 0,
    };
  }

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
}
