import { OmitType } from '@nestjs/swagger';

import { RequestEntity } from '@/database/request.entity';

export class ApplicationRequest extends OmitType(RequestEntity, [
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
