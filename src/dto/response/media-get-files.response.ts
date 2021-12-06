import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { Media } from '@/dto/media.dto';

export class MediaGetFilesResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status: Status.Success;

  @ApiProperty({ description: 'Количество файлов' })
  count: number;

  @ApiProperty({
    description: 'Файлы',
    title: 'Media',
    type: Media,
    isArray: true,
  })
  data: Media[];
}
