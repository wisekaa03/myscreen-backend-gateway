import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { FileIdRequest } from './file-id.request';

export class FilesCopyRequest {
  @ApiProperty({
    description: 'Папка, куда копировать',
    type: String,
    format: 'uuid',
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsUUID()
  toFolder!: string;

  @ApiProperty({
    description: 'Файлы',
    type: FileIdRequest,
    isArray: true,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FileIdRequest)
  files!: FileIdRequest[];
}
