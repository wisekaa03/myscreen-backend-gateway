import { ApiProperty } from '@nestjs/swagger';

import { Status } from '../status.enum';
import { MediaEntity } from '../../database/media.entity';

export class MediaGetFilesResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status: Status.Success;

  @ApiProperty({ description: 'Количество файлов' })
  count: number;

  @ApiProperty({ description: 'Файлы' })
  data: MediaEntity[];
}
