import { hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { publicRestaurantSelect } from '../restaurants/public-restaurant';
import { AuthService } from './auth.service';

describe('AuthService.login restaurant response', () => {
  const safeRestaurant = {
    id: 'restaurant-a',
    name: 'Restaurant A',
    email: 'owner@example.com',
    phone: null,
    address: null,
    plan: 'basic',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock };
  };
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  it('does not load or return delivery access tokens', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-a',
      email: 'owner@example.com',
      name: 'Owner',
      role: 'owner',
      restaurantId: safeRestaurant.id,
      hashedPassword: await hash('correct-password', 4),
      restaurant: safeRestaurant,
    });
    const credentials = {
      email: 'owner@example.com',
      password: 'correct-password',
    };

    const result = await service.login(credentials);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: credentials.email },
      include: { restaurant: { select: publicRestaurantSelect } },
    });
    expect(result.restaurant).toEqual(safeRestaurant);
    expect(result.restaurant).not.toHaveProperty('uberEatsAccessToken');
    expect(result.restaurant).not.toHaveProperty('glovoAccessToken');
  });
});
