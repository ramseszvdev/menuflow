import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { publicRestaurantSelect } from './public-restaurant';
import { RestaurantsService } from './restaurant.service';

describe('RestaurantsService.findById', () => {
  const id = 'restaurant-a';
  const publicRestaurant = {
    id,
    name: 'Restaurant A',
    email: 'owner@example.com',
    phone: null,
    address: null,
    plan: 'basic',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const prisma = {
    restaurant: {
      findUnique: jest.fn(),
    },
  };
  const service = new RestaurantsService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a restaurant without delivery credentials', async () => {
    prisma.restaurant.findUnique.mockResolvedValue(publicRestaurant);

    await expect(service.findById(id)).resolves.toEqual(publicRestaurant);

    expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
      where: { id },
      select: publicRestaurantSelect,
    });
    expect(publicRestaurantSelect).not.toHaveProperty('uberEatsAccessToken');
    expect(publicRestaurantSelect).not.toHaveProperty('glovoAccessToken');
  });

  it('reports a missing restaurant', async () => {
    prisma.restaurant.findUnique.mockResolvedValue(null);

    await expect(service.findById(id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
