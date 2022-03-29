import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';

export class FilesDeleteRequest {
  @ApiProperty({
    description: 'Файлы для удаления',
    type: String,
    isArray: true,
    format: 'uuid',
    required: true,
  })
  @IsDefined({ each: true })
  @IsNotEmpty({ each: true })
  @IsUUID('all', { each: true })
  filesId!: Array<string>;
}
