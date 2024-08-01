import { SpecificFormat } from '@/enums';
import { UserEntity } from '@/database/user.entity';
import { MonitorStatisticsEntity } from '@/database/monitor-statistics.entity';

export interface MsvcFormReportViews {
  user: UserEntity;
  format: SpecificFormat;
  statistics: MonitorStatisticsEntity[];
  dateFrom: Date;
  dateTo: Date;
}
