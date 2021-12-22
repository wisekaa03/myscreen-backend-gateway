import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { FileMonitorsResponse } from '@/dto/response';

export class FileGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Файл',
    type: FileMonitorsResponse,
    isArray: false,
    required: true,
  })
  data!: FileMonitorsResponse;
}
