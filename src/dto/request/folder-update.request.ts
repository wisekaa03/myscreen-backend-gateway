import { PickType } from '@nestjs/swagger';

import { FolderEntity } from '@/database/folder.entity';

export class FolderUpdateRequest extends PickType(FolderEntity, ['name']) {}
