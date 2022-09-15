import { OmitType, PartialType } from '@nestjs/swagger';

import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorUpdateRequest extends PartialType(
  OmitType(MonitorEntity, [
    'lastSeen',
    'user',
    'userId',
    'playlist',
    'files',
    'favorite',
    'favorities',
    'createdAt',
    'updatedAt',
  ]),
) {}
