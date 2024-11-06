import {
  Catch,
  ArgumentsHost,
  Logger,
  HttpException,
  HttpServer,
  UnauthorizedException,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { BaseExceptionFilter } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { TypeORMError } from 'typeorm';
import {
  I18nContext,
  I18nValidationException,
  TranslateOptions,
} from 'nestjs-i18n';

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
    const i18n =
      host.getType() === 'http' ? I18nContext.current(host) : undefined;
    let { message } = exception;

    if (exception instanceof I18nValidationException) {
      if (message === 'Bad Request') {
        message = 'BAD_REQUEST';
      }
    } else if (exception instanceof UnauthorizedException) {
      message = 'UNAUTHORIZED';
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const responseHttpError =
        typeof response !== 'string' ? (response as HttpError) : undefined;
      let code: string | undefined = undefined;
      let error: ConflictData | undefined;
      let options: TranslateOptions | undefined;
      if (responseHttpError) {
        code = responseHttpError.code;
        error = responseHttpError.error;
        options = responseHttpError.options;
      }
      const errors = (exception as any).errors;
      const errorsArray = errors?.map((element: ValidationError) =>
        element.constraints ? Object.values(element.constraints) : undefined,
      );
      const errorsMessage =
        errorsArray && errorsArray.flat(Infinity).join(', ');
      let messageLang = message;
      if (i18n instanceof I18nContext) {
        messageLang = i18n.t(message, {
          lang: i18n.lang,
          defaultValue: message,
          ...options,
        });
        this.logger.error(
          messageLang,
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
            `${messageLang}` + (errorsMessage ? `: ${errorsMessage}` : ''),
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
