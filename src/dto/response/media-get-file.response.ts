import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { MediaResponse } from '@/dto/response';

export class MediaGetFileResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Файл',
    title: 'MediaResponse',
    type: MediaResponse,
    isArray: false,
    required: true,
  })
  data!: MediaResponse;
}
