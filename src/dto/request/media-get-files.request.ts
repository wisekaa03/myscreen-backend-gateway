import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsBoolean, IsEnum, IsString } from 'class-validator';

import { MediaEntity } from '@/database/media.entity';
import { VideoType } from '@/database/enums/video-type.enum';
import { LimitRequest } from './limit.request';

export class MediaGetFilesRequest {
  @ApiProperty({
    description: 'Тип файла',
    enum: VideoType,
    example: VideoType.Video,
    required: false,
  })
  @IsEnum(VideoType)
  type?: VideoType;

  @ApiProperty({
    description: 'Показывать все',
    example: false,
    required: false,
  })
  @IsBoolean()
  showAll?: boolean;

  @ApiProperty({
    description: 'ID папки',
    example: '',
    required: false,
  })
  @IsString()
  folderId?: string;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest<Media>',
    type: LimitRequest,
    required: false,
  })
  @IsObject()
  scope: LimitRequest<MediaEntity>;
}
