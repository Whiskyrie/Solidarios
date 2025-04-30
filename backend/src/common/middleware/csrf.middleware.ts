// src/common/middleware/csrf.middleware.ts
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * Middleware para gerar e enviar tokens CSRF usando o padrão Double Submit Cookie
 */
@Injectable()
export class CsrfTokenMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Gerar um token CSRF aleatório
    const csrfToken = crypto.randomBytes(32).toString('hex');

    // Definir o token como cookie HttpOnly
    res.cookie('csrf_token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      path: '/',
    });

    // Enviar o mesmo token no header para o cliente usar em requisições futuras
    res.setHeader('X-CSRF-Token', csrfToken);

    next();
  }
}

/**
 * Middleware para validar tokens CSRF usando o padrão Double Submit Cookie
 */
@Injectable()
export class CsrfProtectionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Lista de métodos que exigem proteção CSRF
    const methodsToProtect = ['POST', 'PUT', 'PATCH', 'DELETE'];

    // Apenas verificar em métodos que modificam dados
    if (!methodsToProtect.includes(req.method)) {
      return next();
    }

    // Obter token CSRF do cookie
    const cookieToken = req.cookies?.csrf_token;

    // Obter token CSRF do header
    const headerToken = req.headers['x-csrf-token'] as string;

    // Verificar se ambos os tokens existem
    if (!cookieToken || !headerToken) {
      throw new UnauthorizedException('Token CSRF ausente');
    }

    // Verificar se os tokens correspondem
    // Usar comparação em tempo constante para evitar timing attacks
    try {
      const tokensMatch = crypto.timingSafeEqual(
        Buffer.from(cookieToken),
        Buffer.from(headerToken),
      );

      if (!tokensMatch) {
        throw new UnauthorizedException('Token CSRF inválido');
      }

      next();
    } catch (error) {
      // Se ocorrer um erro na comparação (ex: tokens com comprimentos diferentes)
      console.error('Erro na validação do token CSRF:', error);

      // Em produção, não expor detalhes do erro ao cliente
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Token CSRF inválido');
      } else {
        // Em desenvolvimento, incluir mais detalhes para depuração
        throw new UnauthorizedException(
          `Token CSRF inválido: ${error.message}`,
        );
      }
    }
  }
}

/**
 * Middleware para verificar a origem da requisição
 */
@Injectable()
export class SameOriginMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Obter origem da requisição
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // Métodos que modificam dados
    const methodsToCheck = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (methodsToCheck.includes(req.method)) {
      // Se for uma requisição do navegador (com Origin ou Referer)
      if (origin || referer) {
        // Obter host da requisição
        const host = req.headers.host;

        // Verificar se origem corresponde ao host
        let isValid = false;

        if (origin) {
          try {
            const originUrl = new URL(origin);
            isValid = originUrl.host === host;
          } catch {
            isValid = false;
          }
        }

        if (!isValid && referer) {
          try {
            const refererUrl = new URL(referer);
            isValid = refererUrl.host === host;
          } catch {
            isValid = false;
          }
        }

        if (!isValid) {
          throw new UnauthorizedException('Origem inválida');
        }
      }
    }

    next();
  }
}
