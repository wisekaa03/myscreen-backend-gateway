import {
  Catch,
  ArgumentsHost,
  Logger,
  HttpException,
  HttpServer,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { BaseExceptionFilter } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { TypeORMError } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';

import { InternalServerError, HttpError, ConflictData } from '@/errors';
import { Status } from '@/enums';

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
    const i18n = I18nContext.current(host);

    if (exception instanceof HttpException) {
      const { message } = exception;
      const status = exception.getStatus();
      const response = exception.getResponse();
      const responseHttpError =
        typeof response !== 'string' ? (response as HttpError) : undefined;
      let code: string | undefined = undefined;
      let error: ConflictData | undefined;
      if (responseHttpError) {
        code = responseHttpError.code;
        error = responseHttpError.error;
      }
      const errors = (exception as any).errors;
      const errorsArray = errors?.map((element: ValidationError) =>
        element.constraints ? Object.values(element.constraints) : undefined,
      );
      const errorsMessage =
        errorsArray && errorsArray.flat(Infinity).join(', ');
      let messageLang: string | undefined = undefined;
      if (i18n) {
        messageLang = i18n.t(`error.${message}`, {
          lang: i18n.lang,
          defaultValue: message,
        });
        this.logger.error(
          messageLang ?? message,
          this.debugLevel ? exception.stack : undefined,
        );
      } else {
        this.logger.error(
          message,
          this.debugLevel ? exception.stack : undefined,
        );
      }

      const exceptionHttp = Object.assign(exception, {
        response: {
          status: Status.Error,
          statusCode: status,
          message:
            `${messageLang ?? message}` +
            (errorsMessage ? `: ${errorsMessage}` : ''),
          code,
          error,
          errors,
        },
      });
      return super.catch(exceptionHttp, host);
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
