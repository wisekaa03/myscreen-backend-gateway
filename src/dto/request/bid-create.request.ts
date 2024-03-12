import { OmitType } from '@nestjs/swagger';

import { BidEntity } from '@/database/bid.entity';

export class ApplicationCreateRequest extends OmitType(BidEntity, [
  'id',
  'buyer',
  'seller',
  'monitor',
  'playlist',
  'hide',
  'parentRequest',
  'parentRequestId',
  'user',
  'createdAt',
  'updatedAt',
]) {}
