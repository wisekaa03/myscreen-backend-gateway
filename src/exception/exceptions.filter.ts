import {
  Catch,
  type ArgumentsHost,
  Logger,
  HttpException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  PreconditionFailedException,
  InternalServerErrorException,
  NotFoundException,
  RequestTimeoutException,
  ConflictException,
  NotImplementedException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import {
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
  PreconditionFailedError,
  InternalServerError,
  NotFoundError,
  ConflictError,
  NotImplementedError,
  HttpError,
} from '../dto/index';

@Catch()
export class ExceptionsFilter extends BaseExceptionFilter<Error> {
  logger = new Logger(ExceptionsFilter.name);

  catch(exception: HttpException | Error, host: ArgumentsHost) {
    let exceptionAfter: HttpError;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      this.logger.error(exception.message, exception.stack);

      if (exception instanceof UnauthorizedException) {
        exceptionAfter = new UnauthorizedError(exception.message);
      } else if (exception instanceof BadRequestException) {
        const message =
          typeof response === 'object'
            ? (response as Record<string, Array<string>>).message?.join(', ')
            : response;
        exceptionAfter = new BadRequestError(message);
      } else if (exception instanceof ForbiddenException) {
        exceptionAfter = new ForbiddenError(exception.message);
      } else if (exception instanceof NotFoundException) {
        exceptionAfter = new NotFoundError(exception.message);
      } else if (exception instanceof RequestTimeoutException) {
        exceptionAfter = new InternalServerError(exception.message);
      } else if (exception instanceof PreconditionFailedException) {
        exceptionAfter = new PreconditionFailedError(exception.message);
      } else if (exception instanceof NotImplementedException) {
        exceptionAfter = new NotImplementedError(exception.message);
      } else if (exception instanceof ConflictException) {
        exceptionAfter = new ConflictError(
          exception.message,
          response as Record<string, any>,
        );
      } /* exception instanceof InternalServerErrorException */ else {
        exceptionAfter = new InternalServerError(exception.message);
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        exception.message,
        exception.stack,
        'ExceptionsFilter: TypeORM',
      );
      exceptionAfter = new InternalServerError();
    } else {
      this.logger.error(
        (exception as any)?.message || (exception as any).toString(),
        (exception as any)?.stack || exception,
        'ExceptionsFilter: Unknown',
      );
      exceptionAfter = exception;
    }

    super.catch(Object.assign(exception, exceptionAfter), host);
  }
}
