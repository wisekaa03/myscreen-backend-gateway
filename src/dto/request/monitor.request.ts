import { OmitType } from '@nestjs/swagger';

import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorRequest extends OmitType(MonitorEntity, [
  'id',
  'attached',
  'lastSeen',
  'user',
  'userId',
  'currentPlaylist',
  'files',
  'createdAt',
  'updatedAt',
]) {}
