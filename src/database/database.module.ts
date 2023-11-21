import { Module, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { MonitorStatus } from '@/enums/monitor-status.enum';
import { TypeOrmOptionsClass } from '@/utils/typeorm.options';
import { PrintModule } from '@/print/print.module';
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
import { MonitorFavoriteEntity } from './monitor.favorite.entity';
import { MonitorService } from './monitor.service';
import { InvoiceEntity } from './invoice.entity';
import { InvoiceService } from './invoice.service';
import { PlaylistEntity } from './playlist.entity';
import { PlaylistService } from './playlist.service';
import { UptimeMonitoringEntity } from './uptime-monitoring.entity';
import { UserEntity } from './user.entity';
import { UserExtEntity } from './user-ext.entity';
import { UserService } from './user.service';
import { RefreshTokenEntity } from './refreshtoken.entity';
import { RefreshTokenService } from './refreshtoken.service';
import { RequestService } from './request.service';
import { ApplicationEntity } from './request.entity';
import { WalletEntity } from './wallet.entity';
import { WalletService } from './wallet.service';
import { ActService } from './act.service';
import { ActEntity } from './act.entity';
import { MonitorGroupEntity } from './monitor.group.entity';

@Module({
  imports: [
    PrintModule,
    forwardRef(() => MailModule),
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
      MonitorGroupEntity,
      InvoiceEntity,
      PlaylistEntity,
      UptimeMonitoringEntity,
      UserEntity,
      RefreshTokenEntity,
      ApplicationEntity,
      UserExtEntity,
      WalletEntity,
      ActEntity,
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
    RequestService,
    WalletService,
    ActService,
  ],

  exports: [
    EditorService,
    FileService,
    FolderService,
    MonitorService,
    ActService,
    InvoiceService,
    PlaylistService,
    UserService,
    RefreshTokenService,
    RequestService,
    WalletService,
  ],
})
export class DatabaseModule implements OnModuleInit {
  constructor(
    @InjectRepository(MonitorEntity)
    private readonly monitorRepository: Repository<MonitorEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.monitorRepository.manager.transaction(async (manager) => {
      const allMonitors = await manager.find(MonitorEntity, {
        select: [
          'id',
          'status',
          'monitorInfo',
          'angle',
          'model',
          'matrix',
          'brightness',
          'width',
          'height',
        ],
        relations: {},
        loadEagerRelations: false,
      });
      const allMonitorsPromise = allMonitors.map(async (monitor) => {
        const {
          angle,
          model,
          matrix,
          brightness,
          resolution: resolutionLocal = '1920x1080',
        } = monitor.monitorInfo || {};
        const [widthString, heightString] = resolutionLocal.split('x');
        const width = parseInt(widthString, 10);
        const height = parseInt(heightString, 10);
        const monitorUpdate: Partial<MonitorEntity> = {
          status: MonitorStatus.Offline,
        };
        if (monitor.angle === null) monitorUpdate.angle = angle ?? 0;
        if (monitor.model === null) monitorUpdate.model = model || 'unknown';
        if (monitor.matrix === null) monitorUpdate.matrix = matrix || 'IPS';
        if (monitor.brightness === null) {
          monitorUpdate.brightness = brightness ?? 100;
        }
        if (!monitor.width) monitorUpdate.width = width;
        if (!monitor.height) monitorUpdate.height = height;
        await manager.update(MonitorEntity, monitor.id, monitorUpdate);
      });
      await Promise.all(allMonitorsPromise);
    });
  }
}
