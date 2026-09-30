import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipesService } from './recipes.service';

describe('RecipesService.create ingredient lookup', () => {
  const userId = 'user-a';
  const restaurantId = 'restaurant-a';
  let service: RecipesService;
  let createdRecipeData: { profitMargin?: number } | undefined;
  let prisma: {
    user: { findUnique: jest.Mock };
    ingredient: { findMany: jest.Mock };
    recipe: {
      create: jest.Mock<(args: { data: { profitMargin?: number } }) => unknown>;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    createdRecipeData = undefined;
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ restaurantId }) },
      ingredient: { findMany: jest.fn() },
      recipe: {
        create: jest.fn((args: { data: { profitMargin?: number } }) => {
          createdRecipeData = args.data;
          return { id: 'recipe-a' };
        }),
      },
      $transaction: jest.fn(
        (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
      ),
    };
    service = new RecipesService(prisma as unknown as PrismaService);
  });

  it('loads all ingredient costs in one restaurant-scoped query', async () => {
    prisma.ingredient.findMany.mockResolvedValue([
      { id: 'ingredient-a', costPerUnit: 3 },
      { id: 'ingredient-b', costPerUnit: 5 },
    ]);
    const dto = {
      name: 'Dish',
      sellingPrice: 22,
      ingredients: [
        { ingredientId: 'ingredient-a', quantity: 2 },
        { ingredientId: 'ingredient-b', quantity: 1 },
      ],
    } as CreateRecipeDto;

    await service.create(userId, restaurantId, dto);

    expect(prisma.ingredient.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.ingredient.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['ingredient-a', 'ingredient-b'] },
        restaurantId,
      },
      select: { id: true, costPerUnit: true },
    });
    expect(createdRecipeData?.profitMargin).toBe(50);
  });

  it('rejects an ingredient outside the restaurant scope', async () => {
    prisma.ingredient.findMany.mockResolvedValue([]);
    const dto = {
      name: 'Dish',
      sellingPrice: 22,
      ingredients: [{ ingredientId: 'foreign-ingredient', quantity: 1 }],
    } as CreateRecipeDto;

    await expect(
      service.create(userId, restaurantId, dto),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.recipe.create).not.toHaveBeenCalled();
  });
});
