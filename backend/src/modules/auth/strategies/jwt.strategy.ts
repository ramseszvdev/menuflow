import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// 1. Definimos la interfaz del Payload del JWT para evitar 'any'
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  restaurantId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret =
      configService.get<string>('jwt.secret') || process.env.JWT_SECRET;

    // Validación defensiva para asegurarle a TS que el secret no será undefined
    if (!secret) {
      throw new Error(
        'JWT_SECRET no está configurado en las variables de entorno',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // 2. Quitamos 'async' si no realizamos consultas asíncronas y tipamos el payload
  validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      restaurantId: payload.restaurantId,
    };
  }
}
