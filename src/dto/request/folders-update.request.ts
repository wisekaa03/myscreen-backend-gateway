import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { FolderRequest } from './folder.request';

export class FoldersUpdateRequest {
  @ApiProperty({
    description: 'Папки',
    type: FolderRequest,
    isArray: true,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FolderRequest)
  folders!: FolderRequest[];
}
