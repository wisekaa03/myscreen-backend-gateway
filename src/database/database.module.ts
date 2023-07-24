import { Module, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MonitorStatus } from '../enums/index';
import { TypeOrmOptionsClass } from '../shared/typeorm.options';
import { MailModule } from '../mail/mail.module';
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
import { MonitorFavoriteEntity } from './monitor.favorite.entity';
import { MonitorService } from './monitor.service';
import { InvoiceEntity } from './invoice.entity';
import { InvoiceService } from './invoice.service';
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
      MonitorFavoriteEntity,
      InvoiceEntity,
      PlaylistEntity,
      UptimeMonitoringEntity,
      UserEntity,
      RefreshTokenEntity,
      ApplicationEntity,
      UserSizeEntity,
    ]),
  ],

  providers: [
    Logger,
    EditorService,
    FileService,
    FolderService,
    FileService,
    MonitorService,
    InvoiceService,
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
    InvoiceService,
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
