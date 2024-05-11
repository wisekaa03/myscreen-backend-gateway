import {
  ArgumentsHost,
  Catch,
  HttpServer,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  I18nContext,
  I18nValidationError,
  I18nValidationException,
  I18nValidationExceptionFilterDetailedErrorsOption,
  I18nValidationExceptionFilterErrorFormatterOption,
} from 'nestjs-i18n';
import iterate from 'iterare';
import {
  formatI18nErrors,
  mapChildrenToValidationErrors,
} from 'nestjs-i18n/dist/utils';

import { ValidationError } from 'class-validator';
import { ExceptionsFilter } from './exceptions.filter';

type I18nValidationExceptionFilterOptions =
  | I18nValidationExceptionFilterDetailedErrorsOption
  | I18nValidationExceptionFilterErrorFormatterOption;

@Catch(I18nValidationException)
export class I18nValidationExceptionMyScreenFilter extends ExceptionsFilter {
  logger = new Logger(ExceptionsFilter.name);

  constructor(
    applicationRef: HttpServer<any, any, any>,
    configService: ConfigService,
    private readonly options: I18nValidationExceptionFilterOptions = {
      detailedErrors: true,
    },
  ) {
    super(applicationRef, configService);
  }

  catch(exception: I18nValidationException, host: ArgumentsHost) {
    const i18n = I18nContext.current();
    if (!i18n) {
      return super.catch(
        new InternalServerErrorException('Validation error'),
        host,
      );
    }

    const errors = formatI18nErrors(exception.errors ?? [], i18n.service, {
      lang: i18n.lang,
    });

    const normalizedErrors = this.normalizeValidationErrors(errors);

    const hostType = host.getType() as string;
    if (hostType === 'graphql') {
       
      exception.errors = normalizedErrors as I18nValidationError[];
      return exception;
    }

    const validationException = new I18nValidationException(
      normalizedErrors as ValidationError[],
    );
    return super.catch(validationException, host);
  }

  private isWithErrorFormatter(
    options: I18nValidationExceptionFilterOptions,
  ): options is I18nValidationExceptionFilterErrorFormatterOption {
    return 'errorFormatter' in options;
  }

  protected normalizeValidationErrors(
    validationErrors: ValidationError[],
  ): string[] | I18nValidationError[] | object {
    if (
      this.isWithErrorFormatter(this.options) &&
      !('detailedErrors' in this.options) &&
      this.options.errorFormatter
    ) {
      return this.options.errorFormatter(validationErrors);
    }

    if (
      !this.isWithErrorFormatter(this.options) &&
      !this.options.detailedErrors
    ) {
      return this.flattenValidationErrors(validationErrors);
    }

    return validationErrors;
  }

  protected flattenValidationErrors(
    validationErrors: ValidationError[],
  ): string[] {
    return iterate(validationErrors)
      .map((error) => mapChildrenToValidationErrors(error))
      .flatten()
      .filter((item) => !!item.constraints)
      .map((item) => Object.values(item.constraints ?? {}))
      .flatten()
      .toArray();
  }
}
