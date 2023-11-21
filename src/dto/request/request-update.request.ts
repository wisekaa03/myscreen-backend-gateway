import { PickType } from '@nestjs/swagger';

import { RequestEntity } from '@/database/request.entity';

export class ApplicationUpdateRequest extends PickType(RequestEntity, [
  'approved',
]) {}
