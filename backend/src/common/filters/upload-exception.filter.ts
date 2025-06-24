// src/common/filters/upload-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import * as multer from 'multer';

@Catch()
export class UploadExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UploadExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof multer.MulterError) {
      status = HttpStatus.BAD_REQUEST;
      switch (exception.code) {
        case 'LIMIT_FILE_SIZE':
          message = 'Arquivo muito grande. Tamanho máximo: 10MB';
          break;
        case 'LIMIT_FILE_COUNT':
          message = 'Muitos arquivos. Máximo permitido: 5';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          message = 'Campo de arquivo inesperado';
          break;
        default:
          message = `Erro no upload: ${exception.message}`;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `Upload error: ${message}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error:
        status >= HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal Server Error'
          : message,
    });
  }
}
