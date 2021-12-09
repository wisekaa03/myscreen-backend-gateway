import { PickType } from '@nestjs/swagger';
import { MediaEntity } from '@/database/media.entity';

export class MediaUploadRequest extends PickType(MediaEntity, [
  'name',
  'folderId',
]) {}
