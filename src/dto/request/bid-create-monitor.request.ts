import { PickType } from '@nestjs/swagger';

import { BidEntity } from '@/database/bid.entity';

export class BidCreateMonitorRequest extends PickType(BidEntity, [
  'dateWhen',
  'dateBefore',
  'playlistChange',
]) {}
