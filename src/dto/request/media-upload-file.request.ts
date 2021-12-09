import { PickType } from '@nestjs/swagger';

import { MediaEntity } from '@/database/media.entity';

export class MediaUploadFileRequest extends PickType(MediaEntity, [
  'name',
  'folderId',
]) {}
