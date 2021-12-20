import { OmitType, PartialType } from '@nestjs/swagger';

import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorPartialRequest extends PartialType(
  OmitType(MonitorEntity, [
    'id',
    'attached',
    'lastSeen',
    'user',
    'userId',
    'currentPlaylist',
    'files',
    'createdAt',
    'updatedAt',
  ]),
) {}
