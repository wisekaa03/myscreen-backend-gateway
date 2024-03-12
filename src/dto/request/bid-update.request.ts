import { PickType } from '@nestjs/swagger';

import { BidEntity } from '@/database/bid.entity';

export class ApplicationUpdateRequest extends PickType(BidEntity, [
  'approved',
]) {}
