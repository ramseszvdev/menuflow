import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenusService } from './menus.service';

type MenuUpdateArguments = {
  where: { id: string };
  data: {
    name?: string;
    recipes?: { create: Array<{ recipeId: string; order: number }> };
  };
};

describe('MenusService.update recipe tenant scope', () => {
  const userId = 'user-a';
  const restaurantId = 'restaurant-a';
  const menuId = 'menu-a';
  let service: MenusService;
  let prisma: {
    user: { findUnique: jest.Mock };
    menu: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let transaction: {
    recipe: { findMany: jest.Mock };
    menuRecipe: { deleteMany: jest.Mock };
    menu: { update: jest.Mock };
  };
  let menuUpdateArguments: MenuUpdateArguments | undefined;

  beforeEach(() => {
    menuUpdateArguments = undefined;
    transaction = {
      recipe: { findMany: jest.fn() },
      menuRecipe: { deleteMany: jest.fn() },
      menu: {
        update: jest.fn((args: MenuUpdateArguments) => {
          menuUpdateArguments = args;
          return { recipes: [] };
        }),
      },
    };
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ restaurantId }) },
      menu: {
        findFirst: jest.fn().mockResolvedValue({ id: menuId, restaurantId }),
      },
      $transaction: jest.fn(
        (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    service = new MenusService(prisma as unknown as PrismaService);
  });

  const updateDto = {
    name: 'Updated menu',
    recipes: [{ recipeId: 'recipe-from-other-restaurant' }],
  } as UpdateMenuDto;

  it('rejects a recipe from another restaurant before replacing menu relations', async () => {
    transaction.recipe.findMany.mockResolvedValue([]);

    await expect(
      service.update(userId, restaurantId, menuId, updateDto),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(transaction.recipe.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['recipe-from-other-restaurant'] },
        restaurantId,
      },
      select: { id: true },
    });
    expect(transaction.menuRecipe.deleteMany).not.toHaveBeenCalled();
    expect(transaction.menu.update).not.toHaveBeenCalled();
  });

  it('allows recipes belonging to the authorized restaurant', async () => {
    transaction.recipe.findMany.mockResolvedValue([
      { id: 'recipe-from-other-restaurant' },
    ]);

    await service.update(userId, restaurantId, menuId, updateDto);

    expect(transaction.menuRecipe.deleteMany).toHaveBeenCalledWith({
      where: { menuId },
    });
    expect(menuUpdateArguments?.where).toEqual({ id: menuId });
    expect(menuUpdateArguments?.data.recipes?.create).toEqual([
      { recipeId: 'recipe-from-other-restaurant', order: 0 },
    ]);
  });
});
