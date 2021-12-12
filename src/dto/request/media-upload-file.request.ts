import { ApiProperty, PickType } from '@nestjs/swagger';

import { MediaEntity } from '@/database/media.entity';

export class MediaUploadFileRequest extends PickType(MediaEntity, [
  'folderId',
]) {
  @ApiProperty({
    required: true,
  })
  folderId!: string;
}
