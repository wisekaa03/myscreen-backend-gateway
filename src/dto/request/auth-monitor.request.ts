import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AuthMonitorRequest {
  @ApiProperty({
    description: 'Используется для обозначения монитора',
    // Используется для:
    // - GET /auth/auth-get,
    // - GET /file/file-get-s3
    // - POST /monitor/monitors-get
    // - GET /monitor/monitor-get
    // - GET /monitor/monitor-playlist'
    pattern: '^[0-9]{3}-[0-9]{3}-[0-9]{3}$',
    example: '123-456-789',
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @Length(11, 11, { message: i18nValidationMessage('validation.LENGTH') })
  @Matches(/^[0-9]{3}-[0-9]{3}-[0-9]{3}$/, {
    message: i18nValidationMessage('validation.MATCHES'),
  })
  code!: string;
}
