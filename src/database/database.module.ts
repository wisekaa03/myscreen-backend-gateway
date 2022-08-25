import { Module, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MonitorStatus } from '@/enums';
import { TypeOrmOptionsClass } from '@/shared/typeorm.options';
import { MailModule } from '@/mail/mail.module';
import { WSModule } from '@/websocket/ws.module';
import { EditorEntity } from './editor.entity';
import { EditorLayerEntity } from './editor-layer.entity';
import { EditorService } from './editor.service';
import { FolderEntity } from './folder.entity';
import { FolderService } from './folder.service';
import { FolderFileNumberEntity } from './folder.view.entity';
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
import { ApplicationService } from './application.service';
import { ApplicationEntity } from './application.entity';

@Module({
  imports: [
    MailModule,
    forwardRef(() => WSModule),

    TypeOrmModule.forRootAsync({
      useClass: TypeOrmOptionsClass,
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([
      EditorEntity,
      EditorLayerEntity,
      FolderEntity,
      FolderFileNumberEntity,
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
      ApplicationEntity,
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
    ApplicationService,
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
    ApplicationService,
  ],
})
export class DatabaseModule implements OnModuleInit {
  constructor(private readonly monitorService: MonitorService) {}

  async onModuleInit(): Promise<void> {
    await this.monitorService.status(MonitorStatus.Offline);
  }
}
