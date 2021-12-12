import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { MediaResponse } from '@/dto/response';

export class MediaUploadFilesResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
  })
  status!: Status.Success;

  // @ApiProperty({ description: 'Количество файлов' })
  // count!: number;

  @ApiProperty({
    description: 'Файлы',
    title: 'Media',
    type: MediaResponse,
    isArray: true,
  })
  data!: MediaResponse[];
}
