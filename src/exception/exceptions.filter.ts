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
          (response as Record<string, string>).error ??
          (response as Record<string, string>).details;
      }
      if (exception instanceof UnauthorizedException) {
        this.logger.error(`${exception.message} ${response}`, exception.stack);
        exceptionRule = new UnauthorizedError(exception.message);
      } else if (exception instanceof BadRequestException) {
        this.logger.error(`${exception.message} ${response}`, exception.stack);
        exceptionRule = new BadRequestError(exception.message);
      } else if (exception instanceof ForbiddenException) {
        this.logger.error(`${exception.message} ${response}`, exception.stack);
        exceptionRule = new ForbiddenError(exception.message);
      } else if (exception instanceof PreconditionFailedException) {
        this.logger.error(`${exception.message} ${response}`, exception.stack);
        exceptionRule = new PreconditionFailedError(exception.message);
      } else if (exception instanceof InternalServerErrorException) {
        this.logger.error(`${exception.message} ${response}`, exception.stack);
        exceptionRule = new InternalServerError(exception.message);
      }
    }

    super.catch(exceptionRule || exception, host);
  }
}
