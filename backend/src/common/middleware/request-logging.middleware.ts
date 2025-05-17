// src/common/logging/request-logging.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggingService } from '../logging/logging.service';

/**
 * Middleware para registrar detalhes das requisições recebidas
 * e das respostas enviadas com tempos de processamento
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly loggingService: LoggingService) {
    this.loggingService.setContext('HttpRequest');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Armazenar o timestamp de início
    const startTime = Date.now();

    // Registrar a requisição recebida
    this.loggingService.logRequest(req);

    // Interceptar o método original end() para registrar a resposta
    const originalEnd = res.end.bind(res);
    res.end = (...args: any[]) => {
      const responseTime = Date.now() - startTime;

      // Registrar a resposta enviada
      this.loggingService.logResponse(req, res.statusCode, responseTime);

      // Chamar o método original end()
      return originalEnd(...args);
    };

    next();
  }
}
