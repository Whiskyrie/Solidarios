// src/common/interceptors/sanitize.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Sanitiza o corpo da requisição
    if (request.body) {
      request.body = sanitizeData(request.body);
    }

    // Sanitiza parâmetros da query
    if (request.query) {
      request.query = sanitizeData(request.query);
    }

    // Sanitiza parâmetros da URL
    if (request.params) {
      request.params = sanitizeData(request.params);
    }

    return next.handle();
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
