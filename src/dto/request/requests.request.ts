import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum } from 'class-validator';

import { RequestApprove, RequestStatus } from '@/enums';
import { RequestEntity } from '@/database/request.entity';

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
    example: ['2021-01-01', '2021-12-31'],
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  createdAt?: Array<Date>;

  @ApiProperty({
    description: 'Время изменения',
    example: ['2021-01-01', '2021-12-31'],
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: Array<Date>;
}
