import { OmitType } from '@nestjs/swagger';
import { ApplicationEntity } from '@/database/application.entity';

export class CooperationRequest extends OmitType(ApplicationEntity, [
  'buyer',
  'seller',
  'monitor',
  'playlist',
  'user',
  'createdAt',
  'updatedAt',
]) {}
