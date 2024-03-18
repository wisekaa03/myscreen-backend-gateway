import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ResetPasswordVerifyRequest {
  @ApiProperty({ example: 'j481y1b' })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  verify!: string;

  @ApiProperty({ example: 'Secret~12345678' })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @MinLength(8, {
    message: i18nValidationMessage('validation.PASSWORD_MIN_LENGTH'),
  })
  @MaxLength(32, {
    message: i18nValidationMessage('validation.PASSWORD_MAX_LENGTH'),
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: i18nValidationMessage('validation.PASSWORD_TOO_WEAK'),
  })
  password!: string;
}
