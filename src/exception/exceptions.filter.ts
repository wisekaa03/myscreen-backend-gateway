import {
  Catch,
  ArgumentsHost,
  Logger,
  HttpException,
  HttpServer,
  ConflictException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { TypeORMError } from 'typeorm';

import { I18nValidationException } from 'nestjs-i18n';
import {
  InternalServerError,
  HttpError,
  ConflictData,
  ConflictError,
} from '@/errors';

@Catch()
export class ExceptionsFilter extends BaseExceptionFilter<Error> {
  logger = new Logger(ExceptionsFilter.name);

  private debugLevel: boolean;

  constructor(
    applicationRef: HttpServer<any, any, any>,
    configService: ConfigService,
  ) {
    super(applicationRef);
    this.debugLevel = configService.getOrThrow('LOG_LEVEL') === 'debug';
  }

  catch(exception: HttpException | Error, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      let { message } =
        exception instanceof ConflictException
          ? (response as ConflictData)
          : exception;
      if (exception instanceof I18nValidationException) {
        const { errors } = exception;
        const errorsText = errors?.map(({ constraints }) =>
          JSON.stringify(Object.values(constraints ?? {})),
        );
        message = `${message}: ${errorsText}`;
      } else {
        const { error, errors } = response as Record<string, string>;
        if (error) {
          message = `${error}: ${message}`;
        }
        if (errors) {
          message = `${message}: ${JSON.stringify(errors)}`;
        }
      }
      this.logger.error(message, this.debugLevel ? exception.stack : undefined);

      let exceptionHttp: HttpException;
      const { name } = exception;
      if (HttpError[name as keyof typeof HttpError]) {
        exceptionHttp =
          name === 'ConflictException'
            ? new ConflictError(message, {}, response as ConflictData)
            : new HttpError[name as keyof typeof HttpError](message);
      } else {
        exceptionHttp = new InternalServerError(message);
      }

      const errorToThrow = Object.assign(exception, response, exceptionHttp);
      return super.catch(errorToThrow, host);
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
