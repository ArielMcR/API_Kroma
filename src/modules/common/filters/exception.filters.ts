import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    let message = (exceptionResponse as any).message || exception.message;

    if (Array.isArray(message)) {
      message = message.join(', ');
    }
    response.status(status).json({
      statusCode: status,
      message: message,
    });
  }
}
