import { ApiProperty, PickType } from '@nestjs/swagger';
import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorIDResponse extends PickType(MonitorEntity, ['id']) {
  @ApiProperty({ required: true })
  id!: string;
}
