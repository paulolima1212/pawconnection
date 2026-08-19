import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { DomainError } from '../../domain/result';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof DomainError) {
      const status = this.mapDomainError(exception);
      response.status(status).json({
        statusCode: status,
        message: exception.message,
        code: exception.code,
      });
      return;
    }

    if (exception instanceof ThrottlerException) {
      response.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests. Please try again in a moment.',
        code: 'RATE_LIMITED',
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(
        typeof body === 'string' ? { statusCode: status, message: body } : body,
      );
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }

  private mapDomainError(error: DomainError): number {
    switch (error.code) {
      case 'NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'CONFLICT':
        return HttpStatus.CONFLICT;
      case 'VALIDATION':
        return HttpStatus.BAD_REQUEST;
      case 'FORBIDDEN':
        return HttpStatus.FORBIDDEN;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }
}
