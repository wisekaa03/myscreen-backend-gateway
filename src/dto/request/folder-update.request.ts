import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class FolderUpdateRequest {
  @ApiProperty({
    description: 'Идентификатор файла',
    format: 'uuid',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'Наименование папки',
    type: 'string',
    example: 'bar',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiProperty({
    description: 'Родительская папка',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentFolderId?: string;
}
