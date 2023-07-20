import { OmitType } from '@nestjs/swagger';

import { ApplicationEntity } from '../../database/application.entity';

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
    'playlist',
    'playlistId',
    'approved',
    'user',
    'createdAt',
    'updatedAt',
  ],
) {}
