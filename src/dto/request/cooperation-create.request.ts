import { OmitType } from '@nestjs/swagger';
import { CooperationEntity } from '@/database/cooperation.entity';

export class CooperationCreateRequest extends OmitType(CooperationEntity, [
  'id',
  'buyer',
  'seller',
  'monitor',
  'playlist',
  'user',
  'createdAt',
  'updatedAt',
]) {}
