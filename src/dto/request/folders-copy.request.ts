import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { FolderCopyRequest } from './folder-copy.request';

export class FoldersCopyRequest {
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
    description: 'Папки',
    type: FolderCopyRequest,
    isArray: true,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FolderCopyRequest)
  folders!: FolderCopyRequest[];
}
