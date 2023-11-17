import { OmitType } from '@nestjs/swagger';

import { ApplicationEntity } from '@/database/application.entity';

export class ApplicationRequest extends OmitType(ApplicationEntity, [
  'buyer',
  'seller',
  'monitor',
  'playlist',
  'hide',
  'parentApplication',
  'parentApplicationId',
  'user',
  'createdAt',
  'updatedAt',
]) {}
