import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

import { FileEntity } from '@/database/file.entity';

export class FileUpdatesRequest extends PickType(FileEntity, ['id']) {
  @ApiProperty({
    description: 'Имя файла',
    example: 'foo.mp4',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiProperty({
    description: 'Идентификатор папки',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  folderId?: string;
}
