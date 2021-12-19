import { PickType } from '@nestjs/swagger';

import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorIDRequest extends PickType(MonitorEntity, ['id']) {}
