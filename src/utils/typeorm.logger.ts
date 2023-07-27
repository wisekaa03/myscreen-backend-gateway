import { Logger } from '@nestjs/common';
import type { Logger as ITypeOrmLogger } from 'typeorm';

export class TypeOrmLogger implements ITypeOrmLogger {
  private readonly logger = new Logger('TypeOrm');

  /**
   * Logs query and parameters used in it.
   */
  logQuery = (
    message: string,
    param?: unknown[],
    // queryRunner?: QueryRunner,
  ): void => {
    let parameters: string;
    if (Array.isArray(param) && param.length > 0) {
      parameters = ` ${JSON.stringify(
        param.map((field) =>
          typeof field === 'object'
            ? `${JSON.stringify(field).slice(0, 50)}...`
            : field,
        ),
      )}`;
    } else {
      parameters = param ? ` ${JSON.stringify(param)}` : '';
    }
    this.logger.debug(`${message}${parameters}`);
  };

  /**
   * Logs query that is failed.
   */
  logQueryError = (
    error: string,
    message: string,
    param?: unknown[],
    // queryRunner?: QueryRunner,
  ): void => {
    let parameters: string;
    if (Array.isArray(param) && param.length > 0) {
      parameters = ` ${JSON.stringify(
        param.map((field) =>
          typeof field === 'string' ? field.slice(0, 50) : field,
        ),
      )}`;
    } else {
      parameters = param ? ` ${JSON.stringify(param)}` : '';
    }
    this.logger.error(`${message}${parameters}`, error);
  };

  /**
   * Logs query that is slow.
   */
  logQuerySlow = (
    time: number,
    query: string,
    parameters?: unknown[],
    // queryRunner?: QueryRunner,
  ): void => this.logger.debug(`Time is slow: ${time}`, parameters);

  /**
   * Logs events from the schema build process.
   */
  logSchemaBuild = (message: string /* queryRunner?: QueryRunner */): void =>
    this.logger.debug(message);

  /**
   * Logs events from the migrations run process.
   */
  logMigration = (message: string /* queryRunner?: QueryRunner */): void =>
    this.logger.debug(message);

  /**
   * Perform logging using given logger, or by default to the console.
   * Log has its own level and message.
   */
  log = (
    level: 'log' | 'info' | 'warn',
    message: unknown,
    // queryRunner?: QueryRunner,
  ): void => this.logger.debug(message);
}
