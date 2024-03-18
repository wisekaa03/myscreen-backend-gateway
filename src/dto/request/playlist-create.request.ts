import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { PlaylistEntity } from '@/database/playlist.entity';

export class PlaylistCreateRequest extends PickType(PlaylistEntity, [
  'name',
  'description',
]) {
  @ApiProperty({
    description: 'Файлы',
    type: 'string',
    format: 'uuid',
    isArray: true,
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({
    each: true,
    message: i18nValidationMessage('validation.NOT_EMPTY'),
  })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
  files!: string[];
}
