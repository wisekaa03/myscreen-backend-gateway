import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
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
    title: 'Folder',
    type: [FolderResponse],
    isArray: true,
  })
  data!: FolderResponse[];
}
