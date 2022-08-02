import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

import { FolderEntity } from '@/database/folder.entity';

export class FolderPartialRequest extends PartialType(
  PickType(FolderEntity, ['id', 'name', 'parentFolderId']),
) {
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
