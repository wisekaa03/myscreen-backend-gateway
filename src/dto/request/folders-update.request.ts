import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { FolderUpdateRequest } from './folder-update.request';

export class FoldersUpdateRequest {
  @ApiProperty({
    description: 'Папки',
    type: FolderUpdateRequest,
    isArray: true,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FolderUpdateRequest)
  folders!: FolderUpdateRequest[];
}
