import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface UserPayload {
  id: string;
  email?: string;
  restaurantId?: string;
}

// Extendemos la interfaz de Request de Express para incluir a user
interface RequestWithUser extends Request {
  user?: UserPayload;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    // 1. Tipamos la Request explícitamente para evitar el 'any'
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    // 2. Extraemos el usuario (o undefined)
    const user = request.user;

    // 3. Devolvemos la propiedad solicitada o el objeto de usuario completo
    return data ? user?.[data] : user;
  },
);
