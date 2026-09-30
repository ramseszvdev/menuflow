import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string, restaurantId: string) {
    await this.validateRestaurantAccess(userId, restaurantId);

    // Estadísticas básicas
    const [
      totalRecipes,
      totalIngredients,
      totalMenus,
      ingredientsLowStock,
      mostExpensiveRecipes,
      mostProfitableRecipes,
      menuStats,
      ingredientStats,
    ] = await Promise.all([
      this.getTotalRecipes(restaurantId),
      this.getTotalIngredients(restaurantId),
      this.getTotalMenus(restaurantId),
      this.getLowStockIngredients(restaurantId),
      this.getMostExpensiveRecipes(restaurantId),
      this.getMostProfitableRecipes(restaurantId),
      this.getMenuStats(restaurantId),
      this.getIngredientStats(restaurantId),
    ]);

    return {
      overview: {
        totalRecipes,
        totalIngredients,
        totalMenus,
        lowStockCount: ingredientsLowStock.length,
        ingredientsLowStock,
      },
      recipes: {
        mostExpensive: mostExpensiveRecipes,
        mostProfitable: mostProfitableRecipes,
      },
      menus: menuStats,
      inventory: ingredientStats,
      // Datos para gráficos
      charts: {
        costDistribution: await this.getCostDistribution(restaurantId),
        monthlyTrends: this.getMonthlyTrends(restaurantId),
      },
    };
  }

  private async getTotalRecipes(restaurantId: string) {
    return this.prisma.recipe.count({
      where: { restaurantId },
    });
  }

  private async getTotalIngredients(restaurantId: string) {
    return this.prisma.ingredient.count({
      where: { restaurantId },
    });
  }

  private async getTotalMenus(restaurantId: string) {
    return this.prisma.menu.count({
      where: { restaurantId },
    });
  }

  private async getLowStockIngredients(restaurantId: string) {
    return this.prisma.ingredient.findMany({
      where: {
        restaurantId,
        stock: {
          lte: this.prisma.ingredient.fields.minStock,
        },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        unit: true,
      },
      orderBy: {
        stock: 'asc',
      },
      take: 10,
    });
  }

  private async getMostExpensiveRecipes(restaurantId: string) {
    const recipes = await this.prisma.recipe.findMany({
      where: { restaurantId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      take: 5,
    });

    return recipes
      .map((recipe) => {
        const cost = recipe.ingredients.reduce(
          (sum, ri) => sum + ri.ingredient.costPerUnit * ri.quantity,
          0,
        );
        return {
          id: recipe.id,
          name: recipe.name,
          cost: parseFloat(cost.toFixed(2)),
          sellingPrice: recipe.sellingPrice,
          margin:
            recipe.sellingPrice > 0
              ? parseFloat(
                  (
                    ((recipe.sellingPrice - cost) / recipe.sellingPrice) *
                    100
                  ).toFixed(1),
                )
              : 0,
        };
      })
      .sort((a, b) => b.cost - a.cost);
  }

  private async getMostProfitableRecipes(restaurantId: string) {
    const recipes = await this.prisma.recipe.findMany({
      where: { restaurantId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      take: 5,
    });

    return recipes
      .map((recipe) => {
        const cost = recipe.ingredients.reduce(
          (sum, ri) => sum + ri.ingredient.costPerUnit * ri.quantity,
          0,
        );
        const profit = recipe.sellingPrice - cost;
        return {
          id: recipe.id,
          name: recipe.name,
          cost: parseFloat(cost.toFixed(2)),
          sellingPrice: recipe.sellingPrice,
          profit: parseFloat(profit.toFixed(2)),
          margin:
            recipe.sellingPrice > 0
              ? parseFloat(
                  (
                    ((recipe.sellingPrice - cost) / recipe.sellingPrice) *
                    100
                  ).toFixed(1),
                )
              : 0,
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }

  private async getMenuStats(restaurantId: string) {
    const menus = await this.prisma.menu.findMany({
      where: { restaurantId },
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
        },
      },
    });

    let totalCost = 0;
    let totalSellingPrice = 0;

    menus.forEach((menu) => {
      menu.recipes.forEach((mr) => {
        const recipeCost = mr.recipe.ingredients.reduce(
          (sum, ri) => sum + ri.ingredient.costPerUnit * ri.quantity,
          0,
        );
        totalCost += recipeCost;
        totalSellingPrice += mr.recipe.sellingPrice;
      });
    });

    return {
      totalMenus: menus.length,
      averageCostPerMenu:
        menus.length > 0
          ? parseFloat((totalCost / menus.length).toFixed(2))
          : 0,
      averageSellingPricePerMenu:
        menus.length > 0
          ? parseFloat((totalSellingPrice / menus.length).toFixed(2))
          : 0,
      averageProfitPerMenu:
        menus.length > 0
          ? parseFloat(
              ((totalSellingPrice - totalCost) / menus.length).toFixed(2),
            )
          : 0,
    };
  }

  private async getIngredientStats(restaurantId: string) {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { restaurantId },
      include: {
        recipeIngredients: true,
      },
    });

    const totalStockValue = ingredients.reduce(
      (sum, ing) => sum + ing.stock * ing.costPerUnit,
      0,
    );

    const usedIngredients = ingredients.filter(
      (ing) => ing.recipeIngredients.length > 0,
    );
    const unusedIngredients = ingredients.filter(
      (ing) => ing.recipeIngredients.length === 0,
    );

    return {
      totalIngredients: ingredients.length,
      totalStockValue: parseFloat(totalStockValue.toFixed(2)),
      usedIngredientsCount: usedIngredients.length,
      unusedIngredientsCount: unusedIngredients.length,
      topUsedIngredients: ingredients
        .sort((a, b) => b.recipeIngredients.length - a.recipeIngredients.length)
        .slice(0, 5)
        .map((ing) => ({
          id: ing.id,
          name: ing.name,
          usageCount: ing.recipeIngredients.length,
          stock: ing.stock,
          unit: ing.unit,
        })),
    };
  }

  private async getCostDistribution(restaurantId: string) {
    const recipes = await this.prisma.recipe.findMany({
      where: { restaurantId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      take: 20,
    });

    return recipes
      .map((recipe) => {
        const cost = recipe.ingredients.reduce(
          (sum, ri) => sum + ri.ingredient.costPerUnit * ri.quantity,
          0,
        );
        return {
          name: recipe.name,
          cost: parseFloat(cost.toFixed(2)),
          sellingPrice: recipe.sellingPrice,
          profit: parseFloat((recipe.sellingPrice - cost).toFixed(2)),
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }

  private getMonthlyTrends(restaurantId: string) {
    if (!restaurantId) return [];
    const now = new Date();
    const months = 6;
    const trends: Array<{
      month: string;
      revenue: number;
      orders: number;
      profitMargin: number;
    }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      trends.push({
        month: date.toLocaleString('es', { month: 'short', year: 'numeric' }),
        revenue: Math.floor(Math.random() * 10000) + 5000, // Placeholder
        orders: Math.floor(Math.random() * 500) + 200, // Placeholder
        profitMargin: Math.floor(Math.random() * 20) + 40, // Placeholder
      });
    }

    return trends;
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
