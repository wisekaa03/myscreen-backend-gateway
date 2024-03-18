import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class FolderIdUpdateRequest {
  @ApiProperty({
    description: 'Наименование папки',
    type: 'string',
    example: 'bar',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(1, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  name?: string;

  @ApiProperty({
    description: 'Родительская папка',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  parentFolderId?: string;
}
