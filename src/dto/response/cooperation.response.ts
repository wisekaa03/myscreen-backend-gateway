import { OmitType } from '@nestjs/swagger';
import { CooperationEntity } from '@/database/cooperation.entity';

export class CooperationResponse extends OmitType(CooperationEntity, [
  'buyerId',
  'sellerId',
  'monitorId',
  'playlistId',
]) {}
