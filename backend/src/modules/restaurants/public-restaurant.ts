import { Prisma } from '@prisma/client';

export const publicRestaurantSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  plan: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RestaurantSelect;

export type PublicRestaurant = Prisma.RestaurantGetPayload<{
  select: typeof publicRestaurantSelect;
}>;
