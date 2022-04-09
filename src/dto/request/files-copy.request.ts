import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { FileCopyRequest } from './file-copy.request';

export class FilesCopyRequest {
  @ApiProperty({
    description: 'Файлы',
    type: FileCopyRequest,
    isArray: true,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FileCopyRequest)
  files!: FileCopyRequest[];
}
