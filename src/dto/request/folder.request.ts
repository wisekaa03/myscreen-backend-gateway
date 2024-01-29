import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

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
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'Родительская папка',
    format: 'uuid',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  parentFolderId!: string;

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
