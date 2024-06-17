import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { WsEvent } from '@/enums/ws-event.enum';

export class ConstantsResponse {
  @ApiProperty({ description: 'Версия бэкенд' })
  VERSION_BACKEND!: string;

  @ApiProperty({ description: 'Стоимость подписки' })
  SUBSCRIPTION_FEE!: number;

  @ApiProperty({ description: 'Минимальная сумма счета' })
  MIN_INVOICE_SUM!: number;

  @ApiProperty({ description: 'Процент комиссии' })
  COMMISSION_PERCENT!: number;

  @ApiProperty({ description: 'Названия WS событий' })
  WS_EVENT!: typeof WsEvent;
}

export class ConstantsGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Константы',
    type: () => ConstantsResponse,
    required: true,
  })
  data!: ConstantsResponse;
}
