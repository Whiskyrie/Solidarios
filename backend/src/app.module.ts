// src/app.module.ts
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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'solidarios'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('DB_SYNCHRONIZE', false),
        logging: configService.get('DB_LOGGING', false),
      }),
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
          this.configService.get('COOKIE_SECRET', 'your-cookie-secret'),
        ),
        SecurityHeadersLoggerMiddleware,
        SecurityHeadersMiddleware,
      )
      .forRoutes('*');

    // Middleware para verificação de origem
    consumer
      .apply(SameOriginMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
      )
      .forRoutes(
        { path: '*', method: RequestMethod.POST },
        { path: '*', method: RequestMethod.PUT },
        { path: '*', method: RequestMethod.PATCH },
        { path: '*', method: RequestMethod.DELETE },
      );

    // Middleware para geração de tokens CSRF em todas as respostas GET
    consumer
      .apply(CsrfTokenMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.GET });

    // Middleware para validação de tokens CSRF em todas as requisições que modificam dados
    consumer
      .apply(CsrfProtectionMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
      )
      .forRoutes(
        { path: '*', method: RequestMethod.POST },
        { path: '*', method: RequestMethod.PUT },
        { path: '*', method: RequestMethod.PATCH },
        { path: '*', method: RequestMethod.DELETE },
      );
  }
}
