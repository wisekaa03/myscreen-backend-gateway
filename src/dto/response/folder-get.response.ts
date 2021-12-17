import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { FolderResponse } from './folder.response';

export class FolderGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Папки',
    title: 'FolderResponse',
    type: FolderResponse,
    isArray: false,
  })
  data!: FolderResponse;
}
