// import { OmitType } from '@nestjs/swagger';
import { FilePreviewEntity } from '@/database/file-preview.entity';

// OmitType(FilePreviewEntity, []) {}
export class FilePreviewResponse extends FilePreviewEntity {}
