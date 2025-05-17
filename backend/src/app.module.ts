// src/app.module.ts (Modificado para incluir o módulo de logging)
import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos existentes...
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ItemsModule } from './modules/items/items.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { DistributionsModule } from './modules/distributions/distributions.module';

// Guards e Providers
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

// Middleware de segurança
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { SecurityHeadersLoggerMiddleware } from './common/middleware/security-headers-logger.middleware';
import {
  CsrfTokenMiddleware,
  CsrfProtectionMiddleware,
  SameOriginMiddleware,
} from './common/middleware/csrf.middleware';

// Novo Módulo de Logging e Filtros
import { LoggingModule } from './common/logging/logging.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TypeOrmLoggerService } from './common/logging/typeorm-logger';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';

import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

@Module({
  imports: [
    // Configuração do ambiente
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Configuração do TypeORM com banco de dados
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, LoggingModule],
      inject: [ConfigService, TypeOrmLoggerService],
      useFactory: (
        configService: ConfigService,
        typeOrmLogger: TypeOrmLoggerService,
      ): TypeOrmModuleOptions => {
        // Configurações existentes...
        const databaseUrl = configService.get<string>('DATABASE_URL');

        // Verificar se o SSL deve ser usado
        const useSSL = configService.get<string>('DB_SSL', 'true') === 'true';

        // Configuração SSL condicional baseada na variável de ambiente
        const sslConfig = useSSL
          ? {
              ssl: true,
              extra: {
                ssl: {
                  rejectUnauthorized: false,
                },
              },
            }
          : {};

        // Adicionar o logger personalizado à configuração
        const baseConfig = {
          logging: configService.get<boolean>('DB_LOGGING', true),
          logger: typeOrmLogger,
        };

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
            ...baseConfig,
            ...sslConfig,
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_DATABASE', 'solidarios'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
          ...baseConfig,
          ...sslConfig,
        };
      },
    }),

    // Outros módulos da aplicação
    UsersModule,
    AuthModule,
    CategoriesModule,
    ItemsModule,
    InventoryModule,
    DistributionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Registrar o filtro global de exceções com o serviço de logging
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    // Aplicar o middleware de logging primeiro para capturar todas as requisições
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');

    // Outros middlewares existentes...
    consumer
      .apply(
        helmet(),
        cookieParser(
          this.configService.get(
            'COOKIE_SECRET',
            '3vWNwOy3kTQc7Xicg4xZKs8xdDxj4pu4',
          ),
        ),
        SecurityHeadersLoggerMiddleware,
        SecurityHeadersMiddleware,
      )
      .forRoutes('*');

    // Middlewares de CSRF e Same Origin permanecem iguais...
    const shouldCheckOrigin = this.configService.get('CHECK_ORIGIN') === 'true';
    if (shouldCheckOrigin) {
      consumer
        .apply(SameOriginMiddleware)
        .exclude(
          { path: 'auth/login', method: RequestMethod.POST },
          { path: 'auth/register', method: RequestMethod.POST },
          { path: 'auth/refresh', method: RequestMethod.POST },
          { path: 'auth/profile', method: RequestMethod.GET },
        )
        .forRoutes(
          { path: '*', method: RequestMethod.POST },
          { path: '*', method: RequestMethod.PUT },
          { path: '*', method: RequestMethod.PATCH },
          { path: '*', method: RequestMethod.DELETE },
        );
    }

    // Desabilitar CSRF para API mobile
    // Geração de token CSRF opcional apenas para web
    const shouldGenerateCsrf =
      this.configService.get('GENERATE_CSRF') === 'true';
    if (shouldGenerateCsrf) {
      consumer
        .apply(CsrfTokenMiddleware)
        .forRoutes({ path: '*', method: RequestMethod.GET });
    }

    // Validação de CSRF também opcional
    const shouldValidateCsrf =
      this.configService.get('VALIDATE_CSRF') === 'true';
    if (shouldValidateCsrf) {
      consumer
        .apply(CsrfProtectionMiddleware)
        .exclude(
          { path: 'auth/login', method: RequestMethod.POST },
          { path: 'auth/register', method: RequestMethod.POST },
          { path: 'auth/refresh', method: RequestMethod.POST },
          { path: 'auth/profile', method: RequestMethod.GET },
          // Excluir rotas de API mobile da verificação CSRF
          { path: 'api/*', method: RequestMethod.POST },
          { path: 'api/*', method: RequestMethod.PUT },
          { path: 'api/*', method: RequestMethod.PATCH },
          { path: 'api/*', method: RequestMethod.DELETE },
        )
        .forRoutes(
          { path: '*', method: RequestMethod.POST },
          { path: '*', method: RequestMethod.PUT },
          { path: '*', method: RequestMethod.PATCH },
          { path: '*', method: RequestMethod.DELETE },
        );
    }
  }
}
