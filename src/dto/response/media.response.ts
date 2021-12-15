// import { OmitType } from '@nestjs/swagger';
import { MediaEntity } from '@/database/media.entity';

// OmitType(MediaEntity, []) {}
export class MediaResponse extends MediaEntity {}
