import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { MediaEntity } from '@/database/media.entity';
import { LimitRequest } from './limit.request';
import { MediaRequest } from './media.request';

export class MediaGetFilesRequest {
  @ApiProperty({
    description: 'Показывать все',
    example: false,
    required: false,
  })
  @IsBoolean()
  showAll?: boolean;

  @ApiProperty({
    description: 'Запрос',
    title: 'Media',
    required: false,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MediaRequest)
  where!: MediaRequest;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<MediaEntity>;
}
