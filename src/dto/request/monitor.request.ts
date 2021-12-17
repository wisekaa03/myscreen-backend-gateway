import { PartialType, PickType } from '@nestjs/swagger';

import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorRequest extends PartialType(
  PickType(MonitorEntity, ['name']),
) {}
