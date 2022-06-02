import { OmitType } from '@nestjs/swagger';
import { CooperationEntity } from '@/database/cooperation.entity';

export class CooperationRequest extends OmitType(CooperationEntity, [
  'buyer',
  'seller',
  'monitor',
  'playlist',
  'user',
  'createdAt',
  'updatedAt',
]) {}
