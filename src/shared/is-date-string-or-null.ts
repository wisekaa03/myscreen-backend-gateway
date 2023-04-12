import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  isISO8601,
} from 'class-validator';
// eslint-disable-next-line import/no-extraneous-dependencies
import ValidatorJS from 'validator';

export function buildMessage(
  impl: (eachPrefix: string, args?: ValidationArguments) => string,
  validationOptions?: ValidationOptions,
) {
  return (validationArguments?: ValidationArguments): string => {
    const eachPrefix =
      validationOptions && validationOptions.each ? 'each value in ' : '';
    return impl(eachPrefix, validationArguments);
  };
}

export function IsDateStringOrNull(
  options?: ValidatorJS.IsISO8601Options,
  validationOptions?: ValidationOptions,
) {
  // eslint-disable-next-line func-names, @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDateStringOrNull',
      target: object.constructor,
      propertyName,
      constraints: [options],
      options: validationOptions,
      validator: {
        validate(value: any /* , args: ValidationArguments */) {
          return value === null || isISO8601(value, options);
        },
        defaultMessage: buildMessage(
          (eachPrefix: string) =>
            `${eachPrefix}$property must be a valid ISO 8601 date string or null.`,
          validationOptions,
        ),
      },
    });
  };
}
