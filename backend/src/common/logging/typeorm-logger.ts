// src/common/logging/typeorm-logger.ts
import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';
import { LoggingService } from './logging.service';
import { Injectable } from '@nestjs/common';

/**
 * Logger personalizado para o TypeORM integrado com nosso sistema de logs
 */
@Injectable()
export class TypeOrmLoggerService implements TypeOrmLogger {
  constructor(private readonly loggingService: LoggingService) {
    this.loggingService.setContext('TypeORM');
  }

  /**
   * Logs a query and parameters used in it.
   */
  logQuery(
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner,
  ): void {
    const formattedParams = parameters?.length
      ? ` -- Parameters: ${this.stringifyParams(parameters)}`
      : '';

    this.loggingService.debug(`Query: ${query}${formattedParams}`);
  }

  /**
   * Logs a failed query with error details
   */
  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner,
  ): void {
    const formattedParams = parameters?.length
      ? ` -- Parameters: ${this.stringifyParams(parameters)}`
      : '';

    this.loggingService.error(
      `Query failed: ${query}${formattedParams}`,
      error instanceof Error ? error.stack : error,
      'QueryError',
    );
  }

  /**
   * Logs query that is slow.
   */
  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner,
  ): void {
    const formattedParams = parameters?.length
      ? ` -- Parameters: ${this.stringifyParams(parameters)}`
      : '';

    this.loggingService.warn(
      `Slow query (${time}ms): ${query}${formattedParams}`,
      'SlowQuery',
      { executionTime: time },
    );
  }

  /**
   * Logs events from the schema build process.
   */
  logSchemaBuild(message: string, _queryRunner?: QueryRunner): void {
    this.loggingService.log(`Schema build: ${message}`, 'SchemaBuild');
  }

  /**
   * Logs events from the migrations run process.
   */
  logMigration(message: string, _queryRunner?: QueryRunner): void {
    this.loggingService.log(`Migration: ${message}`, 'Migration');
  }

  /**
   * Log when connection is established.
   */
  log(
    level: 'log' | 'info' | 'warn',
    message: any,
    _queryRunner?: QueryRunner,
  ): void {
    switch (level) {
      case 'log':
      case 'info':
        this.loggingService.log(message);
        break;
      case 'warn':
        this.loggingService.warn(message);
        break;
    }
  }

  /**
   * Helper to properly stringify query parameters
   */
  private stringifyParams(parameters: any[]): string {
    try {
      return JSON.stringify(parameters);
    } catch (error) {
      this.loggingService.warn(
        `Failed to stringify query parameters: ${error.message}`,
      );
      return '[Parameters cannot be stringified]';
    }
  }
}
