import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountEntity } from './account.entity';
import { EditorEntity } from './editor.entity';
import { FileEntity } from './file.entity';
import { FolderEntity } from './folder.entity';
import { MediaEntity } from './media.entity';
import { MonitorEntity } from './monitor.entity';
import { OrderEntity } from './order.entity';
import { PaymentLogsEntity } from './payment-logs.entity';
import { PaymentEntity } from './payment.entity';
import { PlaylistEntity } from './playlist.entity';
import { UptimeMonitoringEntity } from './uptime-monitoring.entity';
import { UserEntity } from './user.entity';
import { VideoEntity } from './video.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccountEntity,
      EditorEntity,
      FileEntity,
      FolderEntity,
      MediaEntity,
      MonitorEntity,
      OrderEntity,
      PaymentLogsEntity,
      PaymentEntity,
      PlaylistEntity,
      UptimeMonitoringEntity,
      UserEntity,
      VideoEntity,
    ]),
  ],
  providers: [Logger],
})
export class DatabaseModule {}
