import { PickType } from '@nestjs/swagger';

import { BidEntity } from '@/database/bid.entity';

export class RequestCreateMonitorRequest extends PickType(BidEntity, [
  'dateWhen',
  'dateBefore',
  'playlistChange',
]) {}
