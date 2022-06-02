import { OmitType } from '@nestjs/swagger';
import { CooperationEntity } from '@/database/cooperation.entity';

export class CooperationPartialRequest extends OmitType(CooperationEntity, [
  'buyer',
  'seller',
  'monitor',
  'playlist',
  'user',
  'createdAt',
  'updatedAt',
]) {}
