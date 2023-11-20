import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class FolderCopyRequest {
  @ApiProperty({
    description: 'Идентификатор файла',
    format: 'uuid',
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  id!: string;
}
