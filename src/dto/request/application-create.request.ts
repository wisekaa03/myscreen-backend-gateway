import { OmitType } from '@nestjs/swagger';

import { ApplicationEntity } from '@/database/application.entity';

export class ApplicationCreateRequest extends OmitType(ApplicationEntity, [
  'id',
  'buyer',
  'seller',
  'monitor',
  'playlist',
  'hide',
  'parentApplication',
  'parentApplicationId',
  'subApplication',
  'user',
  'createdAt',
  'updatedAt',
]) {}
