import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { FolderResponse } from './folder.response';

export class FolderGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Папки',
    type: FolderResponse,
    required: true,
  })
  data!: FolderResponse;
}
