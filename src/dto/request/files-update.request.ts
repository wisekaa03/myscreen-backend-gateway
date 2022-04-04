import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { FileUpdatesRequest } from './file-updates.request';

export class FilesUpdateRequest {
  @ApiProperty({
    description: 'Файлы',
    type: FileUpdatesRequest,
    isArray: true,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FileUpdatesRequest)
  files!: FileUpdatesRequest[];
}
