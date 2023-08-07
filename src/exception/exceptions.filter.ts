import {
  Catch,
  type ArgumentsHost,
  Logger,
  HttpException,
  HttpServer,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { TypeORMError } from 'typeorm';

import { InternalServerError, HttpError } from '@/dto';

@Catch()
export class ExceptionsFilter extends BaseExceptionFilter<Error> {
  logger = new Logger(ExceptionsFilter.name);

  debugLevel: boolean;

  constructor(
    applicationRef?: HttpServer<any, any, any>,
    configService?: ConfigService,
  ) {
    super(applicationRef);
    this.debugLevel = configService?.get('LOG_LEVEL') === 'debug';
  }

  catch(exception: HttpException | Error, host: ArgumentsHost) {
    let exceptionAfter: HttpException;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      let { message } = exception;
      const { error } = response as Record<string, string>;
      if (error) {
        message = `${error}: ${message}`;
      }
      this.logger.error(message, this.debugLevel ? exception.stack : undefined);

      const { name } = exception;
      if (HttpError[name as keyof typeof HttpError]) {
        exceptionAfter = new HttpError[name as keyof typeof HttpError](message);
      } else {
        exceptionAfter = new InternalServerError(message);
      }

      return super.catch(
        exceptionAfter ? Object.assign(exception, exceptionAfter) : exception,
        host,
      );
    }

    if (exception instanceof TypeORMError) {
      this.logger.error(
        exception.message,
        exception.stack,
        'ExceptionsFilter: TypeORM',
      );
      return super.catch(
        new InternalServerError(`TypeORM: ${exception.message}`),
        host,
      );
    }

    this.logger.error(exception.message, exception.stack, 'ExceptionsFilter');
    return super.catch(new InternalServerError(exception.message), host);
  }
}
