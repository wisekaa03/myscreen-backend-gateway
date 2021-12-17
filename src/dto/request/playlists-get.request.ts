import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { PlaylistEntity } from '@/database/playlist.entity';
import { LimitRequest } from './limit.request';
import { PlaylistRequest } from './playlist.request';

export class PlaylistsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    title: 'PlaylistRequest',
    type: PlaylistRequest,
    required: true,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PlaylistRequest)
  where!: PlaylistRequest;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<PlaylistEntity>;
}
