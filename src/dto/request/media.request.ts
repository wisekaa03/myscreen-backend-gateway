import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { VideoType } from '@/enums';
import { MediaEntity } from '@/database/media.entity';

export class MediaRequest extends PartialType(
  PickType(MediaEntity, ['type', 'folderId']),
) {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  folderId!: string;

  @ApiProperty({ required: false })
  type?: VideoType;
}
