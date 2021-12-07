import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { Folder } from '../folder.dto';

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
    type: [Folder],
    isArray: true,
  })
  data!: Folder[];
}
