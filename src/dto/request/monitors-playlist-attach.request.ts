import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsUUID, ValidateNested } from 'class-validator';

import { ApplicationCreateMonitorRequest } from './request-create-monitor.request';

export class MonitorsPlaylistAttachRequest {
  @ApiProperty({
    description: 'Плэйлист',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @IsDefined()
  @IsUUID()
  playlistId!: string;

  @ApiProperty({
    description: 'Мониторы',
    type: 'string',
    format: 'uuid',
    isArray: true,
    required: true,
  })
  @IsDefined({ each: true })
  @IsUUID('all', { each: true })
  monitorIds!: Array<string>;

  @ApiProperty({
    description: 'Создание заявки',
    type: ApplicationCreateMonitorRequest,
    required: true,
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => ApplicationCreateMonitorRequest)
  application!: ApplicationCreateMonitorRequest;
}
