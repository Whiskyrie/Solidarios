import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface UploadError {
  code?: string;
  message?: string;
  field?: string;
  maxSize?: number;
}

@Catch()
export class UploadExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UploadExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error('Erro no filtro de upload:', exception);

    const errorInfo = this.extractErrorInfo(exception);
    const httpStatus = this.determineHttpStatus(errorInfo.code);

    response.status(httpStatus).json({
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      message: errorInfo.message,
      error: 'Upload Error',
      details: errorInfo.details,
    });
  }

  private extractErrorInfo(exception: unknown): {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } {
    // Verifica se é um erro conhecido do Multer
    if (this.isMulterError(exception)) {
      return this.handleMulterError(exception);
    }

    // Verifica se é um Error padrão
    if (this.isStandardError(exception)) {
      return {
        code: 'GENERAL_ERROR',
        message: `Erro no upload: ${exception.message}`,
        details: { name: exception.name },
      };
    }

    // Verifica se é um objeto com propriedades de erro
    if (this.isErrorLikeObject(exception)) {
      return {
        code: exception.code || 'UNKNOWN_ERROR',
        message: exception.message || 'Erro desconhecido no upload',
        details: { originalError: exception },
      };
    }

    // Fallback para tipos desconhecidos
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Erro desconhecido no upload',
      details: { exception: String(exception) },
    };
  }

  private isMulterError(exception: unknown): exception is UploadError {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      typeof (exception as any).code === 'string' &&
      [
        'LIMIT_FILE_SIZE',
        'LIMIT_FILE_COUNT',
        'LIMIT_FIELD_KEY',
        'LIMIT_FIELD_VALUE',
        'LIMIT_FIELD_COUNT',
        'LIMIT_UNEXPECTED_FILE',
      ].includes((exception as any).code)
    );
  }

  private isStandardError(exception: unknown): exception is Error {
    return exception instanceof Error;
  }

  private isErrorLikeObject(
    exception: unknown,
  ): exception is { code?: string; message?: string } {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      ('code' in exception || 'message' in exception)
    );
  }

  private handleMulterError(error: UploadError): {
    code: string;
    message: string;
    details: Record<string, unknown>;
  } {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return {
          code: 'FILE_TOO_LARGE',
          message: 'O arquivo enviado excede o tamanho máximo permitido',
          details: {
            maxSize: error.maxSize,
            field: error.field,
          },
        };

      case 'LIMIT_FILE_COUNT':
        return {
          code: 'TOO_MANY_FILES',
          message: 'Número de arquivos excede o limite permitido',
          details: { field: error.field },
        };

      case 'LIMIT_UNEXPECTED_FILE':
        return {
          code: 'UNEXPECTED_FILE',
          message: 'Campo de arquivo inesperado',
          details: { field: error.field },
        };

      case 'LIMIT_FIELD_KEY':
        return {
          code: 'FIELD_NAME_TOO_LONG',
          message: 'Nome do campo muito longo',
          details: { field: error.field },
        };

      case 'LIMIT_FIELD_VALUE':
        return {
          code: 'FIELD_VALUE_TOO_LONG',
          message: 'Valor do campo muito longo',
          details: { field: error.field },
        };

      case 'LIMIT_FIELD_COUNT':
        return {
          code: 'TOO_MANY_FIELDS',
          message: 'Número de campos excede o limite',
          details: {},
        };

      default:
        return {
          code: 'UPLOAD_ERROR',
          message: error.message || 'Erro no upload de arquivo',
          details: { originalCode: error.code },
        };
    }
  }

  private determineHttpStatus(errorCode: string): HttpStatus {
    const statusMap: Record<string, HttpStatus> = {
      FILE_TOO_LARGE: HttpStatus.PAYLOAD_TOO_LARGE,
      TOO_MANY_FILES: HttpStatus.BAD_REQUEST,
      UNEXPECTED_FILE: HttpStatus.BAD_REQUEST,
      FIELD_NAME_TOO_LONG: HttpStatus.BAD_REQUEST,
      FIELD_VALUE_TOO_LONG: HttpStatus.BAD_REQUEST,
      TOO_MANY_FIELDS: HttpStatus.BAD_REQUEST,
      UPLOAD_ERROR: HttpStatus.BAD_REQUEST,
      GENERAL_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
      UNKNOWN_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
    };

    return statusMap[errorCode] || HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
