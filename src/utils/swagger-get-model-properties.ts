import { Type } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import { DECORATORS } from '@nestjs/swagger/dist/constants';

export const swaggerGetModelProperties = (prototype: Type<unknown>): string[] =>
  (
    Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES_ARRAY,
      prototype.prototype,
    ) || []
  )
    .map((key: string) => key.slice(1))
    .filter(
      (key: string) =>
        !isFunction(
          (prototype.prototype as unknown as Record<string, any>)[key],
        ) &&
        key !== 'signedUrl' &&
        key !== 'groupIds',
    );
