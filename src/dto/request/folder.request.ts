import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

import { FolderEntity } from '@/database/folder.entity';

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
    examples: { one: '2021-01-01', two: ['2021-12-31', '2021-12-31'] },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  createdAt?: Array<Date>;

  @ApiProperty({
    description: 'Время изменения',
    examples: { one: '2021-01-01', two: ['2021-12-31', '2021-12-31'] },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: Array<Date>;
}
