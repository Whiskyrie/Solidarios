// src/common/middleware/security-headers-logger.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para monitorar e registrar tentativas suspeitas de
 * manipulação de headers de segurança
 */
@Injectable()
export class SecurityHeadersLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('SecurityHeadersLogger');

  use(req: Request, res: Response, next: NextFunction) {
    // Lista de headers para monitorar tentativas de injeção
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-forwarded-proto',
      'x-forwarded-for',
      'x-client-ip',
      'content-security-policy',
      'x-xss-protection',
      'x-frame-options',
    ];

    // Verificar se há tentativas de injeção de headers
    const suspiciousActivities = suspiciousHeaders
      .filter((header) => req.headers[header])
      .map(
        (header) =>
          `${header}: ${
            Array.isArray(req.headers[header])
              ? req.headers[header].join(', ')
              : req.headers[header]
          }`,
      );

    if (suspiciousActivities.length > 0) {
      this.logger.warn(
        `Tentativa suspeita de manipulação de headers detectada de ${req.ip} - Path: ${req.path} - Headers: ${suspiciousActivities.join(', ')}`,
      );
    }

    // Salvar o IP original antes de prosseguir com o request
    if (req.headers['x-forwarded-for']) {
      // Registra para referência, mas nunca confia em x-forwarded-for diretamente para autorização
      req['originalIp'] = req.ip;
      this.logger.debug(
        `IP original preservado: ${req.ip}, X-Forwarded-For: ${Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'].join(', ') : req.headers['x-forwarded-for']}`,
      );
    }

    next();
  }
}
