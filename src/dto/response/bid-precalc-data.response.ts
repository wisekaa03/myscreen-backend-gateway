import { ApiProperty } from '@nestjs/swagger';

export class RequestPrecalcDataResponse {
  @ApiProperty({
    description: 'Итоговая сумма',
    type: String,
    required: true,
  })
  sum!: string;
}
