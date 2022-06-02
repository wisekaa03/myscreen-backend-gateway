import { OmitType } from '@nestjs/swagger';
import { CooperationEntity } from '@/database/cooperation.entity';

export class CooperationUpdateRequest extends OmitType(CooperationEntity, [
  'id',
  'buyer',
  'buyerId',
  'seller',
  'sellerId',
  'monitor',
  'monitorId',
  'playlist',
  'playlistId',
  'user',
  'createdAt',
  'updatedAt',
]) {}
