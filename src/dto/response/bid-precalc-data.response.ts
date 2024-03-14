import { ApiProperty } from '@nestjs/swagger';

export class BidPrecalcDataResponse {
  @ApiProperty({
    description: 'Итоговая сумма',
    type: String,
    required: true,
  })
  sum!: string;
}
