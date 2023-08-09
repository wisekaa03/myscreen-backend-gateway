import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { PlaylistEntity } from '@/database/playlist.entity';
import { LimitRequest } from './limit.request';
import { PlaylistPartialRequest } from './playlist-partial.request';

export class PlaylistsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: PlaylistPartialRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlaylistPartialRequest)
  where?: FindOptionsWhere<PlaylistPartialRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(PlaylistEntity),
    isArray: true,
    required: false,
  })
  @IsOptional()
  select?: FindOptionsSelect<PlaylistPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest<PlaylistPartialRequest>,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest<PlaylistPartialRequest>)
  scope?: LimitRequest<PlaylistPartialRequest>;
}
