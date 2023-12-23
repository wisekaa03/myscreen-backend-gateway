import { PickType } from '@nestjs/swagger';

import { FileEntity } from '@/database/file.entity';

export class FileIdRequest extends PickType(FileEntity, ['id']) {}
