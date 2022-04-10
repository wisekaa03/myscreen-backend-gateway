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
} from '@/dto';

@Catch()
export class ExceptionsFilter extends BaseExceptionFilter<Error> {
  logger = new Logger(ExceptionsFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    let exceptionRule: Error | undefined;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      this.logger.error(exception.message, exception.stack);

      if (exception instanceof UnauthorizedException) {
        exceptionRule = new UnauthorizedError(exception.message);
      } else if (exception instanceof BadRequestException) {
        let message = response as string;
        if (typeof response !== 'string') {
          if (typeof (response as any).message !== 'string') {
            message = `${(response as any)?.message?.join(', ')}.`;
          } else {
            message = (response as any).message;
          }
        }
        exceptionRule = new BadRequestError(message);
      } else if (exception instanceof ForbiddenException) {
        exceptionRule = new ForbiddenError(exception.message);
      } else if (exception instanceof NotFoundException) {
        exceptionRule = new NotFoundError(exception.message);
      } else if (exception instanceof RequestTimeoutException) {
        exceptionRule = new InternalServerError(exception.message);
      } else if (exception instanceof PreconditionFailedException) {
        exceptionRule = new PreconditionFailedError(exception.message);
      } else if (exception instanceof InternalServerErrorException) {
        exceptionRule = new InternalServerError(exception.message);
      } else if (exception instanceof NotImplementedException) {
        exceptionRule = new NotImplementedError(exception.message);
      } else if (exception instanceof ConflictException) {
        exceptionRule = new ConflictError(
          exception.message,
          response as Record<string, any>,
        );
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        exception.message,
        exception.stack,
        'ExceptionsFilter: TypeORM',
      );
      exceptionRule = new InternalServerError();
    } else {
      this.logger.error(
        (exception as any)?.message || (exception as any).toString(),
        (exception as any)?.stack || exception,
        'ExceptionsFilter: Unknown',
      );
    }

    super.catch(exceptionRule || exception, host);
  }
}
