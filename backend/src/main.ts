import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS para el frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Filtros globales de excepción
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptor de transformación de respuestas
  app.useGlobalInterceptors(new TransformInterceptor());

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('MenuFlow API')
    .setDescription('API para gestión de restaurantes, recetas e inventario')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 MenuFlow API corriendo en http://localhost:${port}`);
  console.log(`📝 Documentación Swagger en http://localhost:${port}/api/docs`);
}
void bootstrap();
