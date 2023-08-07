import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

import { FileEntity } from '@/database/file.entity';

export class FilePartialRequest extends PartialType(
  PickType(FileEntity, ['id', 'folderId', 'category', 'videoType']),
) {
  @ApiProperty({
    description: 'Идентификатор папки',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @IsOptional()
  @IsString()
  folderId?: string;

  @ApiProperty({
    description: 'Время создания',
    example: ['2021-01-01', '2021-12-31'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsDateString({ strict: false }, { each: true })
  createdAt?: Array<Date>;

  @ApiProperty({
    description: 'Время изменения',
    example: ['2021-01-01', '2021-12-31'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: Array<Date>;
}
