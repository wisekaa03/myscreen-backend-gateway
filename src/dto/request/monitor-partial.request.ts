import { OmitType, PartialType } from '@nestjs/swagger';

import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorPartialRequest extends PartialType(
  OmitType(MonitorEntity, [
    'lastSeen',
    'user',
    'userId',
    'playlist',
    'files',
    'createdAt',
    'updatedAt',
  ]),
) {}
