import {
  Catch,
  ArgumentsHost,
  Logger,
  HttpException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  PreconditionFailedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { TypeORMError } from 'typeorm';

import {
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
  PreconditionFailedError,
  InternalServerError,
} from '@/dto';

@Catch()
export class ExceptionsFilter extends BaseExceptionFilter {
  logger = new Logger(ExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    let exceptionRule: unknown;

    if (exception instanceof HttpException) {
      let response = exception.getResponse();
      if (typeof response === 'object') {
        response =
          (response as Record<string, string>).message ??
          (response as Record<string, string>).error ??
          (response as Record<string, string>).details;
      }

      this.logger.error(`${exception.message} ${response}`, exception.stack);

      if (exception instanceof UnauthorizedException) {
        exceptionRule = new UnauthorizedError(exception.message);
      } else if (exception instanceof BadRequestException) {
        exceptionRule = new BadRequestError(exception.message);
      } else if (exception instanceof ForbiddenException) {
        exceptionRule = new ForbiddenError(exception.message);
      } else if (exception instanceof PreconditionFailedException) {
        exceptionRule = new PreconditionFailedError(exception.message);
      } else if (exception instanceof InternalServerErrorException) {
        exceptionRule = new InternalServerError(exception.message);
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      exceptionRule = new InternalServerError();
    }

    super.catch(exceptionRule || exception, host);
  }
}
