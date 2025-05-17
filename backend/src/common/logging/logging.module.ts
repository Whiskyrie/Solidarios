// src/common/logging/logging.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { v4 as uuidv4 } from 'uuid';

import { LoggingService } from './logging.service';
import { LoggingInterceptor } from './logging.interceptor';
import { RequestLoggingMiddleware } from '../middleware/request-logging.middleware';

/**
 * Módulo global para logging na aplicação
 * Configura o serviço de logging, middleware e interceptor
 */
@Global()
@Module({
  imports: [
    // Módulo CLS para manter o contexto da requisição através das promises
    ClsModule.forRoot({
      middleware: {
        mount: true,
        setup: (cls, req) => {
          // Gera um ID único para cada requisição
          cls.set('requestId', uuidv4());

          // Armazena o ID do usuário se estiver autenticado
          if (req.user?.id) {
            cls.set('userId', req.user.id);
          }
        },
      },
    }),
    ConfigModule,
  ],
  providers: [
    LoggingService,
    RequestLoggingMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [LoggingService, RequestLoggingMiddleware],
})
export class LoggingModule {}
