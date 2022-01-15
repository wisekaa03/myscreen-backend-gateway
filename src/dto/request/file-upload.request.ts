import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsDefined, IsJSON, IsNotEmpty, IsUUID } from 'class-validator';

import { FileEntity } from '@/database/file.entity';
import { FileCategory } from '@/enums';

export class FileUploadRequest extends PickType(FileEntity, [
  'folderId',
  'category',
]) {
  @ApiProperty({
    required: false,
  })
  folderId?: string;

  @ApiProperty({
    required: false,
  })
  category?: FileCategory;

  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Монитор',
    required: false,
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
