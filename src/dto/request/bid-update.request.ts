import { PickType } from '@nestjs/swagger';

import { BidEntity } from '@/database/bid.entity';

export class BidUpdateRequest extends PickType(BidEntity, ['approved']) {}
