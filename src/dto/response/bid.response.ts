import { OmitType } from '@nestjs/swagger';

import { BidEntity } from '@/database/bid.entity';

export class BidResponse extends OmitType(BidEntity, [
  'buyerId',
  'sellerId',
  'monitorId',
  'playlistId',
]) {}
