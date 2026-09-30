import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { MenusModule } from './modules/menus/menus.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';

const backendEnvPath = existsSync(resolve(process.cwd(), 'backend/.env'))
  ? resolve(process.cwd(), 'backend/.env')
  : resolve(process.cwd(), '.env');

loadEnv({ path: backendEnvPath, override: true });

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: backendEnvPath,
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    RestaurantsModule,
    IngredientsModule,
    RecipesModule,
    MenusModule,
    PaymentsModule,
    DeliveryModule,
    AnalyticsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
