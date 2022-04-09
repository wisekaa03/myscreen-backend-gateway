import { PickType } from '@nestjs/swagger';

import { FileEntity } from '@/database/file.entity';

export class FileCopyRequest extends PickType(FileEntity, ['id']) {}
