import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsWhere } from 'typeorm';

import { LimitRequest } from './limit.request';
import { PlaylistPartialRequest } from './playlist-partial.request';

export class PlaylistsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: PlaylistPartialRequest,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PlaylistPartialRequest)
  where!: FindOptionsWhere<PlaylistPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope!: LimitRequest<PlaylistPartialRequest>;
}
