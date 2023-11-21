import { OmitType } from '@nestjs/swagger';

import { ApplicationEntity } from '@/database/request.entity';

export class ApplicationRequest extends OmitType(ApplicationEntity, [
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
