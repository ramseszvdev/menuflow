import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  publicRestaurantSelect,
  PublicRestaurant,
} from './public-restaurant';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PublicRestaurant> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      select: publicRestaurantSelect,
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurante con ID ${id} no encontrado.`);
    }

    return restaurant;
  }

  async update(
    id: string,
    data: Prisma.RestaurantUpdateInput,
  ): Promise<PublicRestaurant> {
    await this.findById(id); // Validar existencia
    return this.prisma.restaurant.update({
      where: { id },
      data,
      select: publicRestaurantSelect,
    });
  }
}
