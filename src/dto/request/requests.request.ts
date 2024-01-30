import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum } from 'class-validator';

import { RequestApprove, RequestStatus } from '@/enums';
import { RequestEntity } from '@/database/request.entity';
import { MSRange } from '@/interfaces';

export class ApplicationsRequest extends PartialType(
  OmitType(RequestEntity, [
    'buyer',
    'seller',
    'monitor',
    'playlist',
    'hide',
    'parentRequest',
    'parentRequestId',
    'user',
    'createdAt',
    'updatedAt',
  ]),
) {
  @ApiProperty({
    description: 'Не обработан / Разрешен / Запрещен',
    enum: RequestApprove,
    enumName: 'RequestApprove',
    example: [RequestApprove.NOTPROCESSED, RequestApprove.ALLOWED],
    isArray: true,
    required: false,
  })
  @IsEnum(RequestApprove, { each: true })
  approved?: Array<RequestApprove>;

  @ApiProperty({
    description: 'Ок / Подождите',
    enum: RequestStatus,
    enumName: 'RequestStatus',
    example: [RequestStatus.OK, RequestStatus.WAITING],
    type: 'enum',
    isArray: true,
    required: false,
  })
  @IsEnum(RequestStatus, { each: true })
  status?: Array<RequestStatus>;

  @ApiProperty({
    description: 'Время создания',
    type: 'array',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  createdAt?: MSRange<Date>;

  @ApiProperty({
    description: 'Время изменения',
    type: 'array',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: MSRange<Date>;
}
