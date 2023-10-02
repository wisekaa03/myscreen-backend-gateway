import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

import { ApplicationEntity } from '@/database/application.entity';
import { ApplicationApproved } from '@/enums';

export class ApplicationsRequest extends PartialType(
  OmitType(ApplicationEntity, [
    'buyer',
    'seller',
    'monitor',
    'playlist',
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
    description: 'Время создания',
    example: ['2021-01-01', '2021-12-31'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsDateString({ strict: false }, { each: true })
  createdAt?: Array<Date>;

  @ApiProperty({
    description: 'Время изменения',
    example: ['2021-01-01', '2021-12-31'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: Array<Date>;
}
