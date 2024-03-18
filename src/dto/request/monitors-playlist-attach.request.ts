import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsUUID, ValidateNested } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { BidCreateMonitorRequest } from './bid-create-monitor.request';

export class MonitorsPlaylistAttachRequest {
  @ApiProperty({
    description: 'Плэйлист',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  playlistId!: string;

  @ApiProperty({
    description: 'Мониторы',
    type: 'string',
    format: 'uuid',
    isArray: true,
    required: true,
  })
  @IsDefined({
    each: true,
    message: i18nValidationMessage('validation.IS_DEFINED'),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
  monitorIds!: Array<string>;

  @ApiProperty({
    description: 'Создание заявки',
    type: BidCreateMonitorRequest,
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @ValidateNested({
    message: i18nValidationMessage('validation.VALIDATE_NESTED'),
  })
  @Type(() => BidCreateMonitorRequest)
  bid!: BidCreateMonitorRequest;
}
