import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { WalletResponse } from './wallet.response';

export class WalletOperationsGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({ description: 'Количество операций с кошельком' })
  count!: number;

  @ApiProperty({
    description: 'Операции с кошельком',
    type: WalletResponse,
    isArray: true,
  })
  data!: WalletResponse[];
}
