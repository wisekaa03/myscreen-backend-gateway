import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';

import { VideoType } from '@/database/enums/video-type.enum';
import { MediaEntity } from '@/database/media.entity';

export class MediaRequest extends PartialType(
  PickType(MediaEntity, ['type', 'folderId']),
) {
  @ApiProperty({ required: false })
  type?: VideoType;
}
