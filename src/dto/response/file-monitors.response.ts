import { ApiProperty, OmitType } from '@nestjs/swagger';
import { FileEntity } from '@/database/file.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { MonitorResponse } from './monitor.response';

export class FileMonitorsResponse extends OmitType(FileEntity, ['monitors']) {
  @ApiProperty({
    description: 'Мониторы',
    type: MonitorResponse,
    required: false,
    isArray: true,
  })
  monitors?: MonitorEntity[];
}
