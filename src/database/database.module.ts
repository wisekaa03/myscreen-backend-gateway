import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeOrmOptionsService } from '@/shared/typeorm.options';

import { MailModule } from '@/mail/mail.module';
import { AccountEntity } from './account.entity';
import { EditorEntity } from './editor.entity';
import { FileEntity } from './file.entity';
import { FolderEntity } from './folder.entity';
import { FolderService } from './folder.service';
import { MediaEntity } from './media.entity';
import { MediaService } from './media.service';
import { MonitorEntity } from './monitor.entity';
import { OrderEntity } from './order.entity';
import { PaymentLogsEntity } from './payment-log.entity';
import { PaymentEntity } from './payment.entity';
import { PlaylistEntity } from './playlist.entity';
import { UptimeMonitoringEntity } from './uptime-monitoring.entity';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { VideoEntity } from './video.entity';
import { RefreshTokenEntity } from './refreshtoken.entity';
import { RefreshTokenService } from './refreshtoken.service';

@Module({
  imports: [
    MailModule,

    TypeOrmModule.forRootAsync({
      useClass: TypeOrmOptionsService,
    }),

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
      RefreshTokenEntity,
    ]),
  ],

  providers: [
    Logger,
    UserService,
    RefreshTokenService,
    FolderService,
    MediaService,
  ],

  exports: [UserService, RefreshTokenService, FolderService, MediaService],
})
export class DatabaseModule {}
