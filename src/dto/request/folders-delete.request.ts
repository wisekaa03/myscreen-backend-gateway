import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';

export class FoldersDeleteRequest {
  @ApiProperty({
    description: 'Папки для удаления',
    type: String,
    isArray: true,
    format: 'uuid',
    required: true,
  })
  @IsDefined({ each: true })
  @IsNotEmpty({ each: true })
  @IsUUID('all', { each: true })
  foldersId!: Array<string>;
}
