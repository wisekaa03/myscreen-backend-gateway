import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { UserEntity } from '@/database/user.entity';

export class LoginRequest extends PickType(UserEntity, ['email', 'password']) {
  @ApiProperty({
    example: 'Secret~12345678',
    description:
      'Пароля пользователя (должен удовлетворять минимальным требованиям)',
    minLength: 8,
    maxLength: 30,
    type: 'string',
    format: 'password',
    pattern: '/((?=.*\\d)|(?=.*\\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/',
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
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
