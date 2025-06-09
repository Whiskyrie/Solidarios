// src/common/logging/logging.service.ts
import { Injectable, Scope, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { ClsService } from 'nestjs-cls';
import { Request } from 'express';

/**
 * Interface para definir campos adicionais em mensagens de log
 */
export interface LogContext {
  [key: string]: any;
}

/**
 * Serviço centralizado de logs para a aplicação
 * Implementa a interface LoggerService do NestJS para compatibilidade total
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggingService implements LoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly clsService: ClsService,
  ) {
    this.initializeLogger();
  }

  /**
   * Inicializa o logger com as configurações baseadas no ambiente
   */
  private initializeLogger(): void {
    const transports: Transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, context, ...meta }) => {
              const requestId = this.getRequestId();
              const userId = this.getUserId();
              const contextInfo = context || this.context;

              let logMessage = `${timestamp} [${level}]`;
              if (contextInfo) {
                logMessage += ` [${contextInfo}]`;
              }
              if (requestId) {
                logMessage += ` [ReqID:${requestId}]`;
              }
              if (userId) {
                logMessage += ` [UserID:${userId}]`;
              }

              logMessage += `: ${message}`;

              if (Object.keys(meta).length > 0) {
                logMessage += ` - ${JSON.stringify(this.sanitizeData(meta))}`;
              }

              return logMessage;
            },
          ),
        ),
      }),
    ];

    // Determinar o ambiente atual
    const env = this.configService.get<string>('NODE_ENV', 'development');

    // Adicionar logs em arquivo em produção
    if (env === 'production') {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }

    // Obter nível de log da configuração ou determinar com base no ambiente
    const level = this.configService.get<string>(
      'LOG_LEVEL',
      env === 'production' ? 'info' : 'debug',
    );

    this.logger = winston.createLogger({
      level,
      levels: winston.config.npm.levels,
      defaultMeta: {
        service: this.configService.get<string>('APP_NAME', 'solidarios-api'),
      },
      transports,
    });
  }

  /**
   * Define o contexto para o logger atual
   */
  public setContext(context: string): this {
    this.context = context;
    return this;
  }

  /**
   * Obtém o ID da requisição atual do contexto CLS
   */
  private getRequestId(): string | undefined {
    try {
      return this.clsService.get<string>('requestId');
    } catch {
      return undefined;
    }
  }

  /**
   * Obtém o ID do usuário atual do contexto CLS
   */
  private getUserId(): string | undefined {
    try {
      return this.clsService.get<string>('userId');
    } catch {
      return undefined;
    }
  }

  /**
   * Remove ou mascara dados sensíveis antes de logar
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    const clone = { ...data };

    // Lista de campos sensíveis que devem ser mascarados
    const sensitiveFields = [
      'password',
      'senha',
      'token',
      'secret',
      'Authorization',
      'accessToken',
      'refreshToken',
      'credit_card',
      'cardNumber',
    ];

    // Função recursiva para sanitizar objetos aninhados
    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      const sanitized: any = Array.isArray(obj) ? [] : {};

      for (const key in obj) {
        // Se for um campo sensível, mascarar o valor
        if (
          sensitiveFields.some((field) =>
            key.toLowerCase().includes(field.toLowerCase()),
          )
        ) {
          sanitized[key] = '[REDACTED]';
        }
        // Para objetos e arrays, recursivamente sanitizar
        else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
        // Caso contrário, manter o valor original
        else {
          sanitized[key] = obj[key];
        }
      }

      return sanitized;
    };

    return sanitizeObject(clone);
  }

  /**
   * Métodos do LoggerService para compatibilidade com NestJS
   */
  log(message: any, context?: string, ...meta: any[]): void {
    const logContext = this.buildLogContext(context, meta);
    this.logger.info(message, logContext);
  }

  error(message: any, trace?: string, context?: string, ...meta: any[]): void {
    const logContext = this.buildLogContext(context, meta);
    if (trace) {
      logContext.trace = trace;
    }
    this.logger.error(message, logContext);
  }

  warn(message: any, context?: string, ...meta: any[]): void {
    const logContext = this.buildLogContext(context, meta);
    this.logger.warn(message, logContext);
  }

  debug(message: any, context?: string, ...meta: any[]): void {
    const logContext = this.buildLogContext(context, meta);
    this.logger.debug(message, logContext);
  }

  verbose(message: any, context?: string, ...meta: any[]): void {
    const logContext = this.buildLogContext(context, meta);
    this.logger.verbose(message, logContext);
  }

  /**
   * Constrói o contexto do log com informações adicionais
   */
  private buildLogContext(context?: string, meta: any[] = []): LogContext {
    const logContext: LogContext = { context: context || this.context };

    // Adiciona metadados adicionais, se fornecidos
    if (meta && meta.length > 0) {
      if (meta.length === 1 && typeof meta[0] === 'object') {
        Object.assign(logContext, meta[0]);
      } else {
        logContext.meta = meta;
      }
    }

    return logContext;
  }

  /**
   * Loga o início de uma requisição HTTP
   */
  logRequest(req: Request, context?: string): void {
    this.log(
      `Incoming ${req.method} request to ${req.url}`,
      context || 'HTTP',
      {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        params: req.params,
        query: req.query,
      },
    );
  }

  /**
   * Loga a resposta de uma requisição HTTP
   */
  logResponse(
    req: Request,
    statusCode: number,
    responseTime: number,
    context?: string,
  ): void {
    this.log(
      `Response ${statusCode} sent for ${req.method} ${req.url} in ${responseTime}ms`,
      context || 'HTTP',
      {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode,
        responseTime: `${responseTime}ms`,
      },
    );
  }

  /**
   * Loga uma operação de banco de dados
   */
  logDatabase(
    operation: string,
    entity: string,
    duration?: number,
    context?: string,
  ): void {
    this.log(
      `Database ${operation} on ${entity}${duration ? ` completed in ${duration}ms` : ''}`,
      context || 'Database',
      { operation, entity, duration },
    );
  }

  /**
   * Loga uma operação de autenticação
   */
  logAuth(
    operation: string,
    userId?: string,
    success?: boolean,
    context?: string,
  ): void {
    this.log(
      `Auth ${operation} ${success !== undefined ? (success ? 'succeeded' : 'failed') : ''} ${userId ? `for user ${userId}` : ''}`,
      context || 'Auth',
      { operation, userId, success },
    );
  }
}
