import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

import { FileEntity } from '@/database/file.entity';
import { MSRange } from '@/interfaces';

export class FileRequest extends PartialType(
  PickType(FileEntity, ['id', 'folderId', 'category', 'videoType']),
) {
  @ApiProperty({
    description: 'Идентификатор папки',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @IsString()
  folderId?: string;

  @ApiProperty({
    description: 'Время создания',
    example: ['2021-01-01', '2021-12-31'],
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  createdAt?: MSRange<Date>;

  @ApiProperty({
    description: 'Время изменения',
    example: ['2021-01-01', '2021-12-31'],
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: MSRange<Date>;
}
