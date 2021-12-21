import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsDefined, IsJSON, IsNotEmpty, IsUUID } from 'class-validator';

import { FileEntity } from '@/database/file.entity';

export class FileUploadRequest extends PickType(FileEntity, [
  'folderId',
  'category',
]) {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Монитор',
  })
  @IsUUID()
  monitorId?: string;
}

export class FileUploadRequestBody {
  @IsDefined()
  @IsNotEmpty()
  @IsJSON()
  param!: string;
}
