import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class DeliveryService {
  private uberEatsApiKey: string;
  private glovoApiKey: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.uberEatsApiKey =
      this.configService.getOrThrow<string>('UBER_EATS_API_KEY');
    this.glovoApiKey = this.configService.getOrThrow<string>('GLOVO_API_KEY');
  }

  async syncMenuToUberEats(restaurantId: string, menuId: string) {
    // Verificar acceso
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new BadRequestException('Restaurante no encontrado');
    }

    if (!restaurant.uberEatsStoreId) {
      throw new BadRequestException(
        'El restaurante no está conectado a Uber Eats',
      );
    }

    // Obtener el menú con sus recetas
    const menu = await this.prisma.menu.findFirst({
      where: { id: menuId, restaurantId },
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
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!menu) {
      throw new ForbiddenException('Menú no encontrado');
    }

    // Formatear el menú para Uber Eats
    const uberEatsMenu = {
      name: menu.name,
      description: menu.description || '',
      sections: [
        {
          name: 'Platos Principales',
          items: menu.recipes.map((mr) => ({
            name: mr.recipe.name,
            description: mr.recipe.description || '',
            price: mr.recipe.sellingPrice * 100, // Centavos
            modifiers: [
              {
                name: 'Opciones',
                selections: mr.recipe.ingredients.map((ri) => ({
                  name: `Sin ${ri.ingredient.name}`,
                  price: 0,
                })),
              },
            ],
          })),
        },
      ],
    };

    try {
      // Enviar a Uber Eats
      const response = await axios.put<unknown>(
        `https://api.uber.com/v1/stores/${restaurant.uberEatsStoreId}/menu`,
        uberEatsMenu,
        {
          headers: {
            Authorization: `Bearer ${this.uberEatsApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        message: 'Menú sincronizado con Uber Eats',
        response: response.data,
      };
    } catch (error) {
      let responseData: unknown = null;

      if (axios.isAxiosError(error)) {
        responseData = error.response?.data;
      }

      console.error(
        'Error syncing with Uber Eats:',
        responseData ||
          (error instanceof Error ? error.message : String(error)),
      );

      throw new BadRequestException('Error al sincronizar con Uber Eats');
    }
  }

  async syncMenuToGlovo(restaurantId: string, menuId: string) {
    // Similar a Uber Eats pero con la API de Glovo
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant?.glovoStoreId) {
      throw new BadRequestException('El restaurante no está conectado a Glovo');
    }

    const menu = await this.prisma.menu.findFirst({
      where: { id: menuId, restaurantId },
      include: {
        recipes: {
          include: {
            recipe: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!menu) {
      throw new ForbiddenException('Menú no encontrado');
    }

    try {
      // Formatear para Glovo
      const glovoMenu = {
        sections: [
          {
            name: menu.name,
            description: menu.description || '',
            items: menu.recipes.map((mr) => ({
              name: mr.recipe.name,
              description: mr.recipe.description || '',
              price: mr.recipe.sellingPrice,
              availability: true,
            })),
          },
        ],
      };

      const response = await axios.post<unknown>(
        `https://api.glovoapp.com/v1/stores/${restaurant.glovoStoreId}/menus`,
        glovoMenu,
        {
          headers: {
            Authorization: `Bearer ${this.glovoApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        message: 'Menú sincronizado con Glovo',
        response: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Error syncing with Glovo:',
          error.response?.data || error.message,
        );
      } else if (error instanceof Error) {
        console.error('Error syncing with Glovo:', error.message);
      } else {
        console.error('Error syncing with Glovo:', error);
      }
      throw new BadRequestException('Error al sincronizar con Glovo');
    }
  }

  async connectUberEats(
    userId: string,
    restaurantId: string,
    storeId: string,
    accessToken: string,
  ) {
    await this.validateDeliveryAccess(userId, restaurantId);
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        uberEatsStoreId: storeId,
        uberEatsAccessToken: accessToken,
      },
    });
  }

  async connectGlovo(
    userId: string,
    restaurantId: string,
    storeId: string,
    accessToken: string,
  ) {
    await this.validateDeliveryAccess(userId, restaurantId);
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        glovoStoreId: storeId,
        glovoAccessToken: accessToken,
      },
    });
  }

  async disconnectDelivery(
    userId: string,
    restaurantId: string,
    platform: 'uber' | 'glovo',
  ) {
    await this.validateDeliveryAccess(userId, restaurantId);
    const data =
      platform === 'uber'
        ? { uberEatsStoreId: null, uberEatsAccessToken: null }
        : { glovoStoreId: null, glovoAccessToken: null };

    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data,
    });
  }

  async getDeliveryStatus(restaurantId: string) {
    // Selección mínima: nunca cargar los tokens de acceso de delivery en memoria.
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        uberEatsStoreId: true,
        glovoStoreId: true,
      },
    });

    return {
      uberEats: {
        connected: !!restaurant?.uberEatsStoreId,
        storeId: restaurant?.uberEatsStoreId || null,
      },
      glovo: {
        connected: !!restaurant?.glovoStoreId,
        storeId: restaurant?.glovoStoreId || null,
      },
    };
  }

  private async validateDeliveryAccess(
    userId: string,
    restaurantId: string,
  ): Promise<void> {
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { restaurantId: true },
    });

    if (!user || user.restaurantId !== restaurantId) {
      throw new ForbiddenException('No tienes acceso a este restaurante');
    }
  }
}
