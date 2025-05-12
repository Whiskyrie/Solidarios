// src/app.module.ts
import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
  Logger,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ItemsModule } from './modules/items/items.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { DistributionsModule } from './modules/distributions/distributions.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { SecurityHeadersLoggerMiddleware } from './common/middleware/security-headers-logger.middleware';
import {
  CsrfTokenMiddleware,
  CsrfProtectionMiddleware,
  SameOriginMiddleware,
} from './common/middleware/csrf.middleware';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

// Habilita a opção para aceitar certificados auto-assinados globalmente
// NOTA: Isso deve ser feito antes de qualquer conexão SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

@Module({
  imports: [
    // Configuração do ambiente
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Configuração do TypeORM com banco de dados
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const logger = new Logger('TypeOrmModule');
        // Verificar se existe uma DATABASE_URL definida
        const databaseUrl = configService.get<string>('DATABASE_URL');

        // Configuração SSL personalizada para DigitalOcean
        const sslConfig = {
          ssl: true,
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
        };

        logger.log(`Usando configuração SSL: ${JSON.stringify(sslConfig)}`);

        if (databaseUrl) {
          // Configuração com string de conexão completa
          logger.log(`Conectando usando DATABASE_URL`);
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
            logging: configService.get<boolean>('DB_LOGGING', false),
            ...sslConfig,
          };
        }

        // Configuração com parâmetros individuais (fallback)
        logger.log(`Conectando usando parâmetros individuais`);
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_DATABASE', 'solidarios'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
          logging: configService.get<boolean>('DB_LOGGING', false),
          ...sslConfig,
        };
      },
    }),

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
  ],
})
export class AppModule implements NestModule {
  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    // Middleware de segurança básica
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

    // Desabilitar verificação de origem para todas as rotas da API mobile
    // Habilitar apenas em produção para rotas web específicas
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
