import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { PlaylistEntity } from '@/database/playlist.entity';
import { LimitRequest } from './limit.request';
import { PlaylistRequest } from './playlist.request';

export class PlaylistsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: PlaylistRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlaylistRequest)
  where?: FindOptionsWhere<PlaylistRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(PlaylistEntity),
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsArray()
  select?: FindOptionsSelect<PlaylistRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest<PlaylistRequest>,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest<PlaylistRequest>)
  scope?: LimitRequest<PlaylistRequest>;
}
