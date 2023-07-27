import { PickType } from '@nestjs/swagger';

import { FileEntity } from '@/database/file.entity';

export class FileIDResponse extends PickType(FileEntity, ['id', 'name']) {}
