import { OmitType } from '@nestjs/swagger';
import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorResponse extends OmitType(MonitorEntity, []) {}
