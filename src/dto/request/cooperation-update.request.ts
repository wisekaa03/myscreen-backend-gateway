import { PickType } from '@nestjs/swagger';
import { CooperationEntity } from '@/database/cooperation.entity';

export class CooperationUpdateRequest extends PickType(CooperationEntity, [
  'approved',
]) {}
