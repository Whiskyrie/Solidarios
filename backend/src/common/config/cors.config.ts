// src/common/config/cors.config.ts
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export function createCorsConfig(configService: ConfigService): CorsOptions {
  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  // Se não houver origens configuradas, usar configuração padrão para desenvolvimento
  const origins = allowedOrigins.length
    ? allowedOrigins
    : process.env.NODE_ENV === 'production'
      ? [] // Em produção, não permitir origens por padrão
      : ['http://localhost:3000', 'http://localhost:8080']; // Em desenvolvimento

  return {
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['Content-Disposition', 'X-CSRF-Token'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 3600, // Tempo em segundos que os resultados de preflight podem ser cacheados
  };
}

/**
 * Middleware para adicionar cabeçalhos de segurança relacionados ao CORS
 */
export function corsSecurityHeaders(
  res: { setHeader: (arg0: string, arg1: string) => void },
  next: () => void,
) {
  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
}
