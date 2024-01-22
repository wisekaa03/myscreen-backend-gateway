import { Type } from '@nestjs/common';
import { isFunction, isString } from '@nestjs/common/utils/shared.utils';
import { DECORATORS } from '@nestjs/swagger/dist/constants';

export const swaggerGetModelProperties = (prototype: Type<unknown>): string[] =>
  (
    Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES_ARRAY,
      prototype.prototype,
    ) || []
  )
    .filter(isString)
    .filter(
      (key: string) =>
        key.charAt(0) === ':' &&
        !isFunction(
          (prototype.prototype as unknown as Record<string, any>)[key],
        ) &&
        key !== ':signedUrl' &&
        key !== ':groupIds',
    )
    .map((key: string) => key.slice(1));
