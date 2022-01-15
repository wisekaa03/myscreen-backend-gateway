import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeOrmOptionsClass } from '@/shared/typeorm.options';
import { MailModule } from '@/mail/mail.module';
import { EditorEntity } from './editor.entity';
import { EditorLayerEntity } from './editor-layer.entity';
import { EditorService } from './editor.service';
import { FolderEntity } from './folder.entity';
import { FolderService } from './folder.service';
import { FileEntity } from './file.entity';
import { FileService } from './file.service';
import { FilePreviewEntity } from './file-preview.entity';
import { MonitorEntity } from './monitor.entity';
import { MonitorService } from './monitor.service';
import { OrderEntity } from './order.entity';
import { OrderService } from './order.service';
import { PaymentLogEntity } from './payment-log.entity';
import { PaymentEntity } from './payment.entity';
import { PaymentService } from './payment.service';
import { PlaylistEntity } from './playlist.entity';
import { PlaylistService } from './playlist.service';
import { UptimeMonitoringEntity } from './uptime-monitoring.entity';
import { UserEntity } from './user.entity';
import { UserSizeEntity } from './user.view.entity';
import { UserService } from './user.service';
import { RefreshTokenEntity } from './refreshtoken.entity';
import { RefreshTokenService } from './refreshtoken.service';

@Module({
  imports: [
    MailModule,

    TypeOrmModule.forRootAsync({
      useClass: TypeOrmOptionsClass,
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([
      EditorEntity,
      EditorLayerEntity,
      FolderEntity,
      FileEntity,
      FilePreviewEntity,
      MonitorEntity,
      OrderEntity,
      PaymentLogEntity,
      PaymentEntity,
      PlaylistEntity,
      UptimeMonitoringEntity,
      UserEntity,
      UserSizeEntity,
      RefreshTokenEntity,
    ]),
  ],

  providers: [
    Logger,
    EditorService,
    FileService,
    FolderService,
    FileService,
    MonitorService,
    OrderService,
    PaymentService,
    PlaylistService,
    UserService,
    RefreshTokenService,
  ],

  exports: [
    EditorService,
    FileService,
    FolderService,
    MonitorService,
    OrderService,
    PaymentService,
    PlaylistService,
    UserService,
    RefreshTokenService,
  ],
})
export class DatabaseModule {}
