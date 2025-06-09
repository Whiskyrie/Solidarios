// src/common/interceptors/sanitize.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as sanitizeHtml from 'sanitize-html';
import { Request } from 'express';

/**
 * Função para sanitizar strings, removendo conteúdo potencialmente malicioso
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str;

  // Remove tags HTML e atributos perigosos
  return str
    .replace(
      /<(script|style|iframe|object|embed|form|input|button|textarea|select|option)[^>]*>.*?<\/\1>/gi,
      '',
    )
    .replace(/<[^>]*on\w+\s*=\s*(['"]).*?\1[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, 'data-safe:')
    .replace(/eval\(.*\)/gi, '')
    .replace(/expression\(.*\)/gi, '');
}

/**
 * Função recursiva para sanitizar objetos
 */
export function sanitizeData(data: any): any {
  if (!data) return data;

  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  if (typeof data === 'object') {
    const sanitized = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitized[key] = sanitizeData(data[key]);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Interceptor para sanitizar automaticamente os dados de entrada
 */
@Injectable()
export class SanitizeInputInterceptor implements NestInterceptor {
  private readonly sanitizeOptions: sanitizeHtml.IOptions = {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard', // Isso está corretamente tipado agora
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    this.sanitizeRequest(request);

    return next.handle();
  }

  private sanitizeRequest(request: Request): void {
    if (request.body) {
      request.body = this.sanitizeObject(request.body);
    }

    // Não tente sobrescrever request.query, pois é somente leitura
    if (request.query) {
      // Em vez disso, sanitize cada propriedade individualmente
      Object.keys(request.query).forEach((key) => {
        if (typeof request.query[key] === 'string') {
          request.query[key] = this.sanitizeValue(request.query[key]);
        } else if (Array.isArray(request.query[key])) {
          // Se for um array, sanitize cada item
          request.query[key] = (request.query[key] as string[]).map((item) =>
            typeof item === 'string' ? this.sanitizeValue(item) : item,
          );
        }
      });
    }

    if (request.params) {
      request.params = this.sanitizeObject(request.params);
    }
  }

  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized = { ...obj };
    Object.keys(sanitized).forEach((key) => {
      const value = sanitized[key];
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeValue(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      }
    });
    return sanitized;
  }

  private sanitizeValue(value: string): string {
    return sanitizeHtml(value, this.sanitizeOptions);
  }
}

/**
 * Interceptor para sanitizar automaticamente os dados de saída
 */
@Injectable()
export class SanitizeOutputInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => sanitizeData(data)));
  }
}
