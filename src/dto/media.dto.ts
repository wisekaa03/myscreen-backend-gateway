import { ApiProperty, OmitType } from '@nestjs/swagger';
import { MediaEntity } from '@/database/media.entity';

export class Media extends OmitType(MediaEntity, []) {
  // @ApiProperty({ type: 'integer', example: 2 })
  // usedInEditors: number;
}
