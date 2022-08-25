import { OmitType } from '@nestjs/swagger';
import { ApplicationEntity } from '@/database/application.entity';

export class CooperationCreateRequest extends OmitType(ApplicationEntity, [
  'id',
  'buyer',
  'seller',
  'monitor',
  'playlist',
  'user',
  'createdAt',
  'updatedAt',
]) {}
