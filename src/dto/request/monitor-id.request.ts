import { PartialType, PickType } from '@nestjs/swagger';

import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorRequestID extends PickType(MonitorEntity, ['id']) {}
