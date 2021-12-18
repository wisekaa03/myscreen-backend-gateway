import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { FileResponse } from '@/dto/response';

export class FilesGetResponse {
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
    type: FileResponse,
    isArray: true,
    required: true,
  })
  data!: FileResponse[];
}
