import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { MediaResponse } from '@/dto/response';

export class MediaGetFilesResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({ description: 'Количество файлов' })
  count!: number;

  @ApiProperty({
    description: 'Файлы',
    title: 'MediaResponse',
    type: MediaResponse,
    isArray: true,
    required: true,
  })
  data!: MediaResponse[];
}
