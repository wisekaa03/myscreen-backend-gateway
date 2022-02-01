import { PickType } from '@nestjs/swagger';

import { FilePreviewEntity } from '@/database/file-preview.entity';

export class FilePreviewRequest extends PickType(FilePreviewEntity, [
  'preview',
]) {}
