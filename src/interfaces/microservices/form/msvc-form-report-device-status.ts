import { SpecificFormat } from '@/enums';
import { UserEntity } from '@/database/user.entity';
import { MonitorEntity } from '@/database/monitor.entity';

export interface MsvcFormReportDeviceStatus {
  user: UserEntity;
  format: SpecificFormat;
  monitors: MonitorEntity[];
  dateFrom: Date;
  dateTo: Date;
}
