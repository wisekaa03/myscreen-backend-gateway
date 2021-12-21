import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { FileMonitorsResponse } from '@/dto/response';

export class FilesUploadResponse {
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
    title: 'FileResponse',
    type: FileMonitorsResponse,
    isArray: true,
    required: true,
  })
  data!: FileMonitorsResponse[];
}
