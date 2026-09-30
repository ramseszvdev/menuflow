import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { hash, compare } from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { User } from '@prisma/client';
import {
  publicRestaurantSelect,
  type PublicRestaurant,
} from '../restaurants/public-restaurant';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface AuthResponse {
  user: AuthUser;
  restaurant: PublicRestaurant | null;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, name, restaurantName, phone } = registerDto;

    // 1. Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // 2. Hashear la contraseña con importación directa
    const hashedPassword = await hash(password, 10);

    // 3. Crear restaurante y usuario en transacción
    const result = await this.prisma.$transaction(async (prisma) => {
      const restaurant = await prisma.restaurant.create({
        data: {
          name: restaurantName,
          email: email,
          phone: phone ?? null,
          plan: 'basic',
        },
        select: publicRestaurantSelect,
      });

      const user = await prisma.user.create({
        data: {
          email,
          name,
          hashedPassword,
          role: 'owner',
          restaurantId: restaurant.id,
        },
      });

      return { user, restaurant };
    });

    // 4. Generar token
    const token = this.generateToken(result.user);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      restaurant: result.restaurant,
      token,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { restaurant: { select: publicRestaurantSelect } },
    });

    if (!user || !user.hashedPassword) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 5. Comparar contraseñas de manera segura
    const isPasswordValid = await compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      restaurant: user.restaurant,
      token,
    };
  }

  private generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    };

    return this.jwtService.sign(payload);
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        restaurantId: true,
        createdAt: true,
        updatedAt: true,
        restaurant: { select: publicRestaurantSelect },
      },
    });
  }
}
