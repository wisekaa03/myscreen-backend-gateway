import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { FileEntity } from '@/database/file.entity';
import { MSRange } from '@/interfaces';

export class FileRequest extends PartialType(
  PickType(FileEntity, ['id', 'folderId', 'videoType']),
) {
  @ApiProperty({
    description: 'Идентификатор папки',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @IsOptional({ message: i18nValidationMessage('validation.IS_OPTIONAL') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  folderId?: string;

  @ApiProperty({
    description: 'Время создания',
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
  @IsOptional({ message: i18nValidationMessage('validation.IS_OPTIONAL') })
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
  @IsOptional({ message: i18nValidationMessage('validation.IS_OPTIONAL') })
  @IsDateString(
    { strict: false },
    { each: true, message: i18nValidationMessage('validation.IS_DATE_RANGE') },
  )
  updatedAt?: MSRange<Date>;
}
