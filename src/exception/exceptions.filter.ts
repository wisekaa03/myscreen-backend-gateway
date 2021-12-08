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
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import {
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
  PreconditionFailedError,
  InternalServerError,
  NotFoundError,
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
          (response as Record<string, string | Array<string>>).message ??
          (response as Record<string, string>).error ??
          (response as Record<string, string>).details;
      }

      this.logger.error(
        `Error: ${exception.message}. Description: ${response}.`,
        exception.stack,
      );

      if (exception instanceof UnauthorizedException) {
        exceptionRule = new UnauthorizedError(exception.message);
      } else if (exception instanceof BadRequestException) {
        if (Array.isArray(response)) {
          response = `${response.join(', ')}.`;
        }
        exceptionRule = new BadRequestError(
          `${exception.message}. ${response}`,
        );
      } else if (exception instanceof ForbiddenException) {
        exceptionRule = new ForbiddenError(exception.message);
      } else if (exception instanceof NotFoundException) {
        exceptionRule = new NotFoundError(exception.message);
      } else if (exception instanceof PreconditionFailedException) {
        exceptionRule = new PreconditionFailedError(exception.message);
      } else if (exception instanceof InternalServerErrorException) {
        exceptionRule = new InternalServerError(exception.message);
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        exception.message,
        exception.stack,
        'ExceptionsFilter: TypeORM',
      );
      exceptionRule = new InternalServerError();
    }

    super.catch(exceptionRule || exception, host);
  }
}
