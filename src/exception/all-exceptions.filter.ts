import {
  Catch,
  ArgumentsHost,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  PreconditionFailedException,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import {
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
  PreconditionFailedError,
} from '@/dto';

@Catch()
export class ExceptionsFilter extends BaseExceptionFilter {
  logger = new Logger(ExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    let exceptionRule: unknown;

    if (exception instanceof UnauthorizedException) {
      this.logger.error(exception.message, exception.stack);
      exceptionRule = new UnauthorizedError(exception.message);
    } else if (exception instanceof BadRequestException) {
      this.logger.error(exception.message, exception.stack);
      exceptionRule = new BadRequestError(exception.message);
    } else if (exception instanceof ForbiddenException) {
      this.logger.error(exception.message, exception.stack);
      exceptionRule = new ForbiddenError(exception.message);
    } else if (exception instanceof PreconditionFailedException) {
      this.logger.error(exception.message, exception.stack);
      exceptionRule = new PreconditionFailedError(exception.message);
    }

    super.catch(exceptionRule || exception, host);
  }
}
