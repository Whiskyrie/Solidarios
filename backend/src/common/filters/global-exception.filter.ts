// src/common/filters/global-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from '../logging/logging.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(LoggingService) private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setContext('ExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = this.getErrorResponse(exception, status);

    // Log detalhado do erro
    this.logException(exception, request, status, errorResponse);

    // Resposta para o cliente
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorResponse.message,
      ...(process.env.NODE_ENV !== 'production' && errorResponse.details
        ? { details: errorResponse.details }
        : {}),
    });
  }

  private getErrorResponse(
    exception: unknown,
    status: number,
  ): { message: string; details?: any } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'object') {
        return {
          message:
            (response as any).message || exception.message || 'Ocorreu um erro',
          details: (response as any).details || response,
        };
      }

      return {
        message: response || exception.message,
      };
    }

    if (exception instanceof Error) {
      return {
        message:
          status === Number(HttpStatus.INTERNAL_SERVER_ERROR)
            ? 'Erro interno do servidor'
            : exception.message,
        details:
          process.env.NODE_ENV !== 'production'
            ? { name: exception.name, stack: exception.stack }
            : undefined,
      };
    }

    return {
      message: 'Erro interno do servidor',
      details:
        process.env.NODE_ENV !== 'production' ? { exception } : undefined,
    };
  }

  private logException(
    exception: unknown,
    request: Request,
    status: number,
    errorResponse: { message: string; details?: any },
  ): void {
    const { method, url, body, query, params, ip, headers } = request;

    // Preparar informações de log
    const logInfo = {
      method,
      url,
      statusCode: status,
      ip,
      userAgent: headers['user-agent'],
      errorMessage: errorResponse.message,
      query,
      params,
      // Remover dados sensíveis antes de logar
      body: this.sanitizeBody(body),
    };

    // Log com nível apropriado baseado no status HTTP
    if (status >= 500) {
      // Erros do servidor - alto nível de severidade
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.loggingService.error(
        `[${status}] ${method} ${url} - ${errorResponse.message}`,
        stack,
        'ExceptionFilter',
        logInfo,
      );
    } else if (status >= 400) {
      // Erros do cliente - nível médio de severidade
      this.loggingService.warn(
        `[${status}] ${method} ${url} - ${errorResponse.message}`,
        'ExceptionFilter',
        logInfo,
      );
    } else {
      // Outros erros - nível informativo
      this.loggingService.log(
        `[${status}] ${method} ${url} - ${errorResponse.message}`,
        'ExceptionFilter',
        logInfo,
      );
    }
  }

  private sanitizeBody(body: any): any {
    if (!body) {
      return {};
    }

    const result = { ...body };
    // Lista de campos que devem ser removidos/mascarados nos logs
    const sensitiveFields = [
      'password',
      'senha',
      'token',
      'secret',
      'accessToken',
      'refreshToken',
    ];

    for (const field of sensitiveFields) {
      if (result[field]) {
        result[field] = '***REDACTED***';
      }
    }

    return result;
  }
}
