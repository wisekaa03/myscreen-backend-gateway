import { OmitType } from '@nestjs/swagger';
import { FileEntity } from '@/database/file.entity';

export class FileResponse extends OmitType(FileEntity, ['monitors']) {}
