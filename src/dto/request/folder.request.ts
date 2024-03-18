import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { FolderEntity } from '@/database/folder.entity';
import { MSRange } from '@/interfaces';

export class FolderRequest extends PartialType(
  PickType(FolderEntity, ['name']),
) {
  @ApiProperty({
    description: 'Идентификатор файла',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  id!: string;

  @ApiProperty({
    description: 'Родительская папка',
    format: 'uuid',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  parentFolderId!: string;

  @ApiProperty({
    description: 'Время создания',
    type: 'array',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsDateString(
    { strict: false },
    { each: true, message: i18nValidationMessage('validation.IS_DATE_RANGE') },
  )
  createdAt?: MSRange<Date>;

  @ApiProperty({
    description: 'Время изменения',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    { strict: false },
    { each: true, message: i18nValidationMessage('validation.IS_DATE_RANGE') },
  )
  updatedAt?: MSRange<Date>;
}
