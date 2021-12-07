import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { FolderResponse } from './folder.response';

export class FolderUpdateResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Папка',
    title: 'Folder',
    type: FolderResponse,
  })
  data!: FolderResponse;
}
