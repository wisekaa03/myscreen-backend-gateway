import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, Validate } from 'class-validator';

import { RequestApprove, RequestStatus } from '@/enums';
import { RequestEntity } from '@/database/request.entity';
import { MSRange } from '@/interfaces';
import { IsDateStringOrNull } from '@/utils/is-date-string-or-null';

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
    'dateWhen',
    'dateBefore',
    'createdAt',
    'updatedAt',
  ]),
) {
  @ApiProperty({
    type: 'array',
    description: 'Не обработан / Разрешен / Запрещен',
    enum: RequestApprove,
    enumName: 'RequestApprove',
    oneOf: [
      { type: 'enum' },
      {
        type: 'array',
        items: { type: 'enum' },
      },
    ],
    examples: {
      one: RequestApprove.NOTPROCESSED,
      range: [RequestApprove.NOTPROCESSED, RequestApprove.ALLOWED],
    },
    required: false,
  })
  @IsEnum(RequestApprove, { each: true })
  approved?: MSRange<RequestApprove>;

  @ApiProperty({
    type: 'array',
    description: 'Ок / Подождите',
    enum: RequestStatus,
    enumName: 'RequestStatus',
    oneOf: [
      { type: 'enum' },
      {
        type: 'array',
        items: { type: 'enum' },
      },
    ],
    examples: {
      one: RequestStatus.OK,
      range: [RequestStatus.OK, RequestStatus.WAITING],
    },
    required: false,
  })
  @IsEnum(RequestStatus, { each: true })
  status?: MSRange<RequestStatus>;

  @ApiProperty({
    type: 'array',
    description: 'Время когда',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  dateWhen!: MSRange<Date>;

  @ApiProperty({
    type: 'array',
    description: 'Время до',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    nullable: true,
    required: false,
  })
  @Validate(IsDateStringOrNull, { each: true })
  dateBefore!: MSRange<Date | null>;

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
