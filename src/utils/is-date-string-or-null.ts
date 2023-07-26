import {
  isISO8601,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isDateStringOrNull' })
export class IsDateStringOrNull implements ValidatorConstraintInterface {
  validate(value: unknown /* , args: ValidationArguments */): boolean {
    return value === null || isISO8601(value, { strict: false });
  }
}
