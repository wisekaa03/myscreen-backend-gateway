import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { LimitRequest } from './limit.request';
import { PlaylistPartialRequest } from './playlist-partial.request';

export class PlaylistsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    title: 'PlaylistRequest',
    type: PlaylistPartialRequest,
    required: false,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PlaylistPartialRequest)
  where!: Partial<PlaylistPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<PlaylistPartialRequest>;
}
