import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { Folder } from '../folder.dto';

export class FolderCreateResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Папка',
    title: 'Folder',
    type: Folder,
  })
  data!: Folder;
}
