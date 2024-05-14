import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FoldersDeleteRequest {
  @ApiProperty({
    description: 'Папки для удаления',
    type: String,
    isArray: true,
    format: 'uuid',
    required: true,
  })
  @IsDefined({
    each: true,
    message: i18nValidationMessage('validation.IS_DEFINED'),
  })
  @IsNotEmpty({
    each: true,
    message: i18nValidationMessage('validation.IS_NOT_EMPTY'),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
  foldersId!: string[];
}
