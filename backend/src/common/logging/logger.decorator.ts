// src/common/logging/logger.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { LoggingService } from './logging.service';

/**
 * Decorator para injetar o serviço de logging em qualquer lugar
 * com o nome da classe definido automaticamente como contexto
 */
export const Logger = createParamDecorator(
  async (data: string | undefined, ctx: ExecutionContext) => {
    // Obter o provedor LoggingService do container usando resolve
    const request = ctx.switchToHttp().getRequest();
    const loggingService = await request.app.resolve(LoggingService);

    // Se não houver contexto definido explicitamente, usar o nome da classe
    if (!data) {
      const contextClass = ctx.getClass();
      const contextHandler = ctx.getHandler();
      const context = contextClass
        ? `${contextClass.name}.${contextHandler.name}`
        : undefined;
      return loggingService.setContext(context);
    }

    // Caso contrário, usar o contexto fornecido
    return loggingService.setContext(data);
  },
);

/**
 * Decorator para logar automaticamente as chamadas de método,
 * incluindo tempos de execução e parâmetros
 */
export function LogMethod(
  options: { includeArgs?: boolean; includeDuration?: boolean } = {},
) {
  const { includeArgs = true, includeDuration = true } = options;

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Obter o serviço de logging - assume-se que está no contexto da classe
      const loggingService = this.logger || {
        debug: (message: any, context?: any, data?: any) =>
          console.debug(`[${context}] ${message}`, data || ''),
        error: (message: any, trace?: any, context?: any) =>
          console.error(`[${context}] ${message}`, trace || ''),
      };
      const className = this.constructor.name;
      const methodName = propertyKey;

      try {
        // Log antes da execução
        if (includeArgs) {
          loggingService.debug(
            `Chamando ${className}.${methodName}`,
            className,
            {
              args: args.map((arg) =>
                typeof arg === 'object' ? '[Object]' : arg,
              ),
            },
          );
        } else {
          loggingService.debug(
            `Chamando ${className}.${methodName}`,
            className,
          );
        }

        const startTime = includeDuration ? Date.now() : 0;
        const result = await originalMethod.apply(this, args);

        // Log após execução bem-sucedida
        if (includeDuration) {
          const duration = Date.now() - startTime;
          loggingService.debug(
            `Concluído ${className}.${methodName} em ${duration}ms`,
            className,
          );
        } else {
          loggingService.debug(
            `Concluído ${className}.${methodName}`,
            className,
          );
        }

        return result;
      } catch (error) {
        // Log de erro
        loggingService.error(
          `Erro em ${className}.${methodName}: ${error.message}`,
          error.stack,
          className,
        );
        throw error;
      }
    };

    return descriptor;
  };
}
