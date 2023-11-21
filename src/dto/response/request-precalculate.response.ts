import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';

export class ApplicationPrecalculateSumResponse {
  @ApiProperty({
    description: 'Итоговая сумма',
    type: String,
    required: true,
  })
  sum!: string;
}

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
    description: 'Возвращаемое значение',
    type: ApplicationPrecalculateSumResponse,
    required: true,
  })
  data!: ApplicationPrecalculateSumResponse;
}
