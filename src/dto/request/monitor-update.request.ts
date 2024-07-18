import { OmitType, PartialType } from '@nestjs/swagger';

import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorUpdateRequest extends PartialType(
  OmitType(MonitorEntity, [
    'lastSeen',
    'user',
    'userId',
    'playlist',
    'files',
    'monitorInfo',
    'favorite',
    'favorities',
    'groupOnlineMonitors',
    'createdAt',
    'updatedAt',
  ]),
) {}
