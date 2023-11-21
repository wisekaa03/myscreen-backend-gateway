import { PickType } from '@nestjs/swagger';

import { ApplicationEntity } from '@/database/request.entity';

export class ApplicationUpdateRequest extends PickType(ApplicationEntity, [
  'approved',
]) {}
