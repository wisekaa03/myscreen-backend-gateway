import { OmitType } from '@nestjs/swagger';
import { MediaEntity } from '@/database/media.entity';

export class MediaResponse extends OmitType(MediaEntity, []) {}
