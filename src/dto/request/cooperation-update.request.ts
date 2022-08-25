import { PickType } from '@nestjs/swagger';
import { ApplicationEntity } from '@/database/application.entity';

export class CooperationUpdateRequest extends PickType(ApplicationEntity, [
  'approved',
]) {}
