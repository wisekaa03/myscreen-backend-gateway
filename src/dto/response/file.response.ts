import { ApiProperty, OmitType } from '@nestjs/swagger';
import { FileEntity } from '@/database/file.entity';
import { MonitorIDResponse } from './monitor-id.response';

export class FileResponse extends OmitType(FileEntity, ['monitors']) {
  @ApiProperty({
    description: 'Мониторы',
    title: 'MonitorResponse',
    type: MonitorIDResponse,
    required: false,
    isArray: true,
  })
  monitors?: MonitorIDResponse[];
}
