import { PickType } from '@nestjs/swagger';
import { FilePreviewEntity } from '@/database/file-preview.entity';

export class FilePreviewResponse extends PickType(FilePreviewEntity, ['id']) {}
