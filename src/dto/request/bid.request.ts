import { OmitType } from '@nestjs/swagger';

import { BidEntity } from '@/database/bid.entity';

export class ApplicationRequest extends OmitType(BidEntity, [
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
