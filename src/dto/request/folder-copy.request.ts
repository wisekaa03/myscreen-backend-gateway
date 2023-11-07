import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FolderCopyRequest {
  @ApiProperty({
    description: 'Идентификатор файла',
    format: 'uuid',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  id!: string;
}
