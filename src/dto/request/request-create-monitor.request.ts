import { OmitType } from '@nestjs/swagger';

import { RequestEntity } from '@/database/request.entity';

export class ApplicationCreateMonitorRequest extends OmitType(RequestEntity, [
  'id',
  'buyer',
  'buyerId',
  'seller',
  'sellerId',
  'monitor',
  'monitorId',
  'status',
  'hide',
  'parentRequest',
  'parentRequestId',
  'playlist',
  'playlistId',
  'approved',
  'user',
  'sum',
  'createdAt',
  'updatedAt',
]) {}
