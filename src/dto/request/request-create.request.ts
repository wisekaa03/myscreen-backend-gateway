import { OmitType } from '@nestjs/swagger';

import { RequestEntity } from '@/database/request.entity';

export class ApplicationCreateRequest extends OmitType(RequestEntity, [
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
