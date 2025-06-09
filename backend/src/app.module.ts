// backend/src/app.module.ts
import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ✅ IMPORTAR AppDataSource
import { AppDataSource } from './config/typeorm.config';

// Outros imports...
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ItemsModule } from './modules/items/items.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { DistributionsModule } from './modules/distributions/distributions.module';

// Guards, Filters, Middleware...
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { LoggingModule } from './common/logging/logging.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TypeOrmLoggerService } from './common/logging/typeorm-logger';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';

// Middleware imports...
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { SecurityHeadersLoggerMiddleware } from './common/middleware/security-headers-logger.middleware';
import {
  CsrfTokenMiddleware,
  CsrfProtectionMiddleware,
  SameOriginMiddleware,
} from './common/middleware/csrf.middleware';

import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ✅ CORRIGIDO: Usar AppDataSource em vez de configuração inline
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, LoggingModule],
      inject: [ConfigService, TypeOrmLoggerService],
      useFactory: (
        configService: ConfigService,
        typeOrmLogger: TypeOrmLoggerService,
      ) => {
        // ✅ Usar as opções do AppDataSource
        const dataSourceOptions = {
          ...AppDataSource.options,
          logger: typeOrmLogger,
          autoLoadEntities: true, // ✅ Para compatibilidade com NestJS

          // ✅ Sobrescrever configurações específicas se necessário
          logging: configService.get<boolean>('DB_LOGGING', true),
          synchronize: false, // ✅ SEMPRE false quando usando migrações
          migrationsRun: configService.get<boolean>('MIGRATIONS_RUN', false),
        };

        return dataSourceOptions;
      },
    }),

    // Outros módulos
    UsersModule,
    AuthModule,
    CategoriesModule,
    ItemsModule,
    InventoryModule,
    DistributionsModule,
    LoggingModule,
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
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');

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

    const shouldGenerateCsrf =
      this.configService.get('GENERATE_CSRF') === 'true';
    if (shouldGenerateCsrf) {
      consumer
        .apply(CsrfTokenMiddleware)
        .forRoutes({ path: '*', method: RequestMethod.GET });
    }

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
