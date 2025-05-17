// src/common/logging/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggingService } from './logging.service';
import { ClsService } from 'nestjs-cls';

/**
 * Interceptor para adicionar logs em cada requisição HTTP
 * Registra tempo de resposta, detalhes da resposta e erros
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly clsService: ClsService,
  ) {
    this.loggingService.setContext('HttpInterceptor');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query } = request;
    const startTime = Date.now();

    // Adicionar o contexto da classe e do manipulador para logs mais detalhados
    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;

    // Log da entrada da requisição
    this.loggingService.debug(
      `Processando ${method} ${url}`,
      `${controllerName}.${handlerName}`,
      {
        params,
        query,
        body: this.sanitizeRequestBody(body),
      },
    );

    return next.handle().pipe(
      tap((response) => {
        const responseTime = Date.now() - startTime;
        const statusCode = context.switchToHttp().getResponse().statusCode;

        // Log da resposta bem-sucedida
        this.loggingService.log(
          `${method} ${url} ${statusCode} - ${responseTime}ms`,
          `${controllerName}.${handlerName}`,
          {
            responseTime,
            statusCode,
            response: this.sanitizeResponse(response),
          },
        );
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        let statusCode = 500;
        let errorResponse: any = {
          message: error.message || 'Internal Server Error',
        };

        // Se for uma exceção HTTP do NestJS, extrair o status e a resposta
        if (error instanceof HttpException) {
          statusCode = error.getStatus();
          errorResponse = error.getResponse();
        }

        // Log do erro
        this.loggingService.error(
          `${method} ${url} ${statusCode} - ${responseTime}ms`,
          error.stack,
          `${controllerName}.${handlerName}`,
          {
            responseTime,
            statusCode,
            errorResponse,
          },
        );

        // Repassar o erro para ser tratado pelos manipuladores de exceção
        throw error;
      }),
    );
  }

  /**
   * Remove dados sensíveis do corpo da requisição
   */
  private sanitizeRequestBody(body: any): any {
    if (!body) return {};

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'senha',
      'secret',
      'token',
      'accessToken',
      'refreshToken',
    ];

    // Mascarar campos sensíveis
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Limita o tamanho e sanitiza a resposta para evitar logs muito grandes
   */
  private sanitizeResponse(response: any): any {
    if (!response) return null;

    // Se for um objeto ou array grande, limitar a quantidade de informação
    if (typeof response === 'object') {
      const isArray = Array.isArray(response);

      if (isArray && response.length > 10) {
        return `Array with ${response.length} items`;
      }

      const stringified = JSON.stringify(response);
      if (stringified.length > 1000) {
        if (isArray) {
          return `Array with ${response.length} items (truncated)`;
        }
        return 'Large object response (truncated)';
      }
    }

    return response;
  }
}
