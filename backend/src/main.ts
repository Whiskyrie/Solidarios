// src/main.ts (com CORS)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import {
  createCorsConfig,
  corsSecurityHeaders,
} from './common/config/cors.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { SanitizeInputInterceptor } from './common/interceptors/sanitize.interceptor';
import { LoggingService } from './common/logging/logging.service';
import { AppDataSource } from './config/typeorm.config';
import { JwtConfigService } from './config/jwt.config'; // ✅ NOVO

async function bootstrap() {
  // ✅ Validar configuração de segurança ANTES de iniciar
  try {
    console.log('🔐 Validando configuração de segurança...');

    // Criar uma instância temporária do ConfigService para validação
    const tempApp = await NestFactory.create(AppModule, { logger: false });
    const configService = tempApp.get(ConfigService);

    // ✅ Validar secrets JWT
    JwtConfigService.getInstance(configService);
    console.log('✅ Configuração JWT validada');

    await tempApp.close();
  } catch (error) {
    console.error('❌ Erro na validação de segurança:', error.message);
    console.error('💡 Dica: Verifique suas variáveis de ambiente JWT_*_SECRET');
    process.exit(1);
  }

  // Inicializar banco e migrações
  try {
    if (!AppDataSource.isInitialized) {
      console.log('🔄 Inicializando conexão com o banco de dados...');
      await AppDataSource.initialize();
      console.log('✅ Conexão com banco estabelecida');

      if (process.env.MIGRATIONS_RUN === 'true') {
        console.log('🔄 Executando migrações...');
        await AppDataSource.runMigrations();
        console.log('✅ Migrações executadas com sucesso');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar banco/migrações:', error);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Injeção de dependência para validadores personalizados
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // ✅ CORS com configuração de segurança
  app.enableCors(createCorsConfig(configService));

  // Aplicar middleware de cabeçalhos de segurança após a configuração CORS
  app.use(corsSecurityHeaders);

  // ✅ Headers de segurança aprimorados
  app.use(
    (
      _req: any,
      res: { setHeader: (arg0: string, arg1: string) => void },
      next: () => void,
    ) => {
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

      // ✅ HSTS em produção
      if (process.env.NODE_ENV === 'production') {
        res.setHeader(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains; preload',
        );
      }

      next();
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      disableErrorMessages: process.env.NODE_ENV === 'production',
      forbidUnknownValues: true,
      stopAtFirstError: false,
    }),
  );

  // Usar resolve() em vez de get() para LoggingService
  const loggingService = await app.resolve(LoggingService);

  // Aplicar filtros e interceptores globais
  app.useGlobalFilters(new GlobalExceptionFilter(loggingService));
  app.useGlobalInterceptors(
    new TransformResponseInterceptor(),
    new SanitizeInputInterceptor(),
  );

  // ✅ Swagger com autenticação JWT
  const config = new DocumentBuilder()
    .setTitle('API Solidários')
    .setDescription('API para o sistema de gerenciamento de doações Solidários')
    .setVersion('1.0')
    .addTag('auth', 'Endpoints de autenticação e segurança')
    .addTag('users', 'Endpoints de usuários')
    .addTag('items', 'Endpoints de itens/doações')
    .addTag('categories', 'Endpoints de categorias de itens')
    .addTag('inventory', 'Endpoints de gerenciamento de estoque')
    .addTag('distributions', 'Endpoints de distribuição de doações')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  loggingService.log(`🚀 Aplicação iniciada na porta ${port}`, 'Bootstrap');
  loggingService.log(
    `🔐 Segurança JWT configurada com token rotation`,
    'Bootstrap',
  );
  console.log(
    `🔐 Recursos de segurança ativados: Token Rotation, Session Management, Rate Limiting`,
  );
}

bootstrap().catch((err) => {
  console.error('❌ Falha ao iniciar aplicação:', err);
  process.exit(1);
});
