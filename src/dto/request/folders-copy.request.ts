import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { FolderCopyRequest } from './folder-copy.request';

export class FoldersCopyRequest {
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
