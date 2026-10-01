import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const isPrismaKnownError =
      exception instanceof Prisma.PrismaClientKnownRequestError;
    const isPrismaUnknownRequestError =
      typeof (Prisma as unknown as Record<string, unknown>)
        .PrismaClientUnknownRequestError === 'function' &&
      exception instanceof
        (Prisma as unknown as {
          PrismaClientUnknownRequestError: new (...args: never[]) => Error;
        }).PrismaClientUnknownRequestError;
    const isPrismaValidationError =
      exception instanceof Prisma.PrismaClientValidationError;
    const isPrismaInitializationError =
      exception instanceof Prisma.PrismaClientInitializationError;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let exceptionResponse: unknown = 'Internal server error';

    if (isHttpException) {
      status = exception.getStatus();
      exceptionResponse = exception.getResponse();
    } else if (isPrismaKnownError) {
      status =
        exception.code === 'P2002'
          ? HttpStatus.CONFLICT
          : exception.code === 'P2025'
            ? HttpStatus.NOT_FOUND
            : exception.code === 'P2003'
              ? HttpStatus.BAD_REQUEST
              : HttpStatus.INTERNAL_SERVER_ERROR;
      exceptionResponse =
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Error de base de datos'
          : exception.code === 'P2002'
            ? 'El registro ya existe'
            : exception.code === 'P2025'
              ? 'El registro no existe'
              : 'La operación viola una relación de datos';
    } else if (isPrismaValidationError) {
      status = HttpStatus.BAD_REQUEST;
      exceptionResponse = 'Datos inválidos para la operación de base de datos';
    } else if (isPrismaUnknownRequestError) {
      // Ej: borrar un menú con recetas asociadas (FK RESTRICT de Postgres,
      // código 23001). No debe ser un 500 sin mensaje útil.
      const rawMessage = exception instanceof Error ? exception.message : '';
      const isForeignKeyViolation =
        rawMessage.includes('23001') ||
        rawMessage.includes('violates RESTRICT') ||
        rawMessage.includes('Foreign key constraint') ||
        rawMessage.includes('menu_recipes_menuId_fkey');
      status = isForeignKeyViolation
        ? HttpStatus.BAD_REQUEST
        : HttpStatus.INTERNAL_SERVER_ERROR;
      exceptionResponse = isForeignKeyViolation
        ? 'No se puede completar la operación porque el registro tiene datos relacionados'
        : 'Error de base de datos';
    } else if (isPrismaInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      exceptionResponse =
        'La base de datos no está disponible. Verifica la conexión del servidor.';
    } else if (exception instanceof Error) {
      console.error('Unhandled backend exception:', exception);
    } else {
      console.error('Unhandled backend exception:', exception);
    }

    // Manejo de la respuesta independientemente de si el mensaje es un string o un objeto
    const message =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : { message: exceptionResponse };

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...message,
    });
  }
}
