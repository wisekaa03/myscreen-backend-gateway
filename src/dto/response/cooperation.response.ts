import { OmitType } from '@nestjs/swagger';
import { ApplicationEntity } from '@/database/application.entity';

export class CooperationResponse extends OmitType(ApplicationEntity, [
  'buyerId',
  'sellerId',
  'monitorId',
  'playlistId',
]) {}
