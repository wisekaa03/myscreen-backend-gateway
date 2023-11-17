import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum } from 'class-validator';

import { ApplicationEntity } from '@/database/application.entity';
import { ApplicationApproved, ApplicationStatus } from '@/enums';

export class ApplicationsRequest extends PartialType(
  OmitType(ApplicationEntity, [
    'buyer',
    'seller',
    'monitor',
    'playlist',
    'hide',
    'parentApplication',
    'parentApplicationId',
    'user',
    'createdAt',
    'updatedAt',
  ]),
) {
  @ApiProperty({
    description: 'Не обработан / Разрешен / Запрещен',
    enum: ApplicationApproved,
    enumName: 'ApplicationApproved',
    example: [ApplicationApproved.NOTPROCESSED, ApplicationApproved.ALLOWED],
    isArray: true,
    required: false,
  })
  @IsEnum(ApplicationApproved, { each: true })
  approved?: Array<ApplicationApproved>;

  @ApiProperty({
    description: 'Ок / Подождите',
    enum: ApplicationStatus,
    enumName: 'ApplicationStatus',
    example: [ApplicationStatus.OK, ApplicationStatus.WAITING],
    type: 'enum',
    isArray: true,
    required: false,
  })
  @IsEnum(ApplicationStatus, { each: true })
  status?: Array<ApplicationStatus>;

  @ApiProperty({
    description: 'Время создания',
    examples: { one: '2021-01-01', two: ['2021-12-31', '2021-12-31'] },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  createdAt?: Array<Date>;

  @ApiProperty({
    description: 'Время изменения',
    examples: { one: '2021-01-01', two: ['2021-12-31', '2021-12-31'] },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: Array<Date>;
}
