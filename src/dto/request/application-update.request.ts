import { PickType } from '@nestjs/swagger';

import { ApplicationEntity } from '@/database/application.entity';

export class ApplicationUpdateRequest extends PickType(ApplicationEntity, [
  'approved',
]) {}
