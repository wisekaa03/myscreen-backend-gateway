import { OmitType } from '@nestjs/swagger';

import { ApplicationEntity } from '@/database/request.entity';

export class ApplicationCreateRequest extends OmitType(ApplicationEntity, [
  'id',
  'buyer',
  'seller',
  'monitor',
  'playlist',
  'hide',
  'parentRequest',
  'parentRequestId',
  'user',
  'createdAt',
  'updatedAt',
]) {}
