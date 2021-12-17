import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { FolderResponse } from './folder.response';

export class FoldersGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status.Success;

  @ApiProperty({ description: 'Количество папок', example: 1 })
  count!: number;

  @ApiProperty({
    description: 'Папки',
    type: FolderResponse,
    isArray: true,
  })
  data!: FolderResponse[];
}
