// src/main.ts (com CORS)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { SanitizeInputInterceptor } from './common/interceptors/sanitize.interceptor';
import {
  createCorsConfig,
  corsSecurityHeaders,
} from './common/config/cors.config';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { LoggingService } from './common/logging/logging.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Injeção de dependência para validadores personalizados
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Configurar CORS
  app.enableCors(createCorsConfig(configService));

  // Aplicar middleware de cabeçalhos de segurança após a configuração CORS
  app.use(corsSecurityHeaders);

  // Configurar ValidationPipe global com opções avançadas
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

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('API Solidários')
    .setDescription('API para o sistema de gerenciamento de doações Solidários')
    .setVersion('1.0')
    .addTag('auth', 'Endpoints de autenticação')
    .addTag('users', 'Endpoints de usuários')
    .addTag('items', 'Endpoints de itens/doações')
    .addTag('categories', 'Endpoints de categorias de itens')
    .addTag('inventory', 'Endpoints de gerenciamento de estoque')
    .addTag('distributions', 'Endpoints de distribuição de doações')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(configService.get('PORT', 3000));

  // Usuário optional: Logar informação de inicialização do servidor
  loggingService.log(
    `Aplicação iniciada na porta ${configService.get('PORT', 3000)}`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
