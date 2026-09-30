import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    restaurantId?: string;
  };
}

export const CurrentRestaurantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const restaurantId = request.user?.restaurantId;

    if (!restaurantId) {
      throw new UnauthorizedException(
        'No se encontró el ID del restaurante en el token de autorización.',
      );
    }

    return restaurantId;
  },
);
