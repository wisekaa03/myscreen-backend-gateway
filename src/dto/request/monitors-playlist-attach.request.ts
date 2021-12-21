import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsUUID } from 'class-validator';

export class MonitorsPlaylistAttachRequest {
  @ApiProperty({
    description: 'Плэйлист',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @IsDefined()
  @IsUUID()
  playlistId!: string;

  @ApiProperty({
    description: 'Мониторы',
    type: 'string',
    format: 'uuid',
    isArray: true,
    required: true,
  })
  @IsDefined({ each: true })
  @IsUUID('all', { each: true })
  monitors!: string[];
}
