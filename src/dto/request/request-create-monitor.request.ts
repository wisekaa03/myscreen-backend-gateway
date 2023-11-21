import { OmitType } from '@nestjs/swagger';

import { ApplicationEntity } from '@/database/request.entity';

export class ApplicationCreateMonitorRequest extends OmitType(
  ApplicationEntity,
  [
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
    'createdAt',
    'updatedAt',
  ],
) {}
