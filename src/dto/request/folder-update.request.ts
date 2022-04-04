import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class FolderUpdateRequest {
  @ApiProperty({
    description: 'Наименование папки',
    type: 'string',
    example: 'bar',
    required: false,
  })
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiProperty({
    description: 'Родительская папка',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  parentFolderId?: string;
}
