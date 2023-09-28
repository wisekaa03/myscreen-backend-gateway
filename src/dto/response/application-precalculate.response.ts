import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';

export class ApplicationPrecalculateResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Возврат после предрасчета',
    type: String,
    required: true,
  })
  data!: number;
}
