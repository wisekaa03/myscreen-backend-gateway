import { Module, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import { InjectEntityManager, TypeOrmModule } from '@nestjs/typeorm';

import { MonitorStatus } from '@/enums/monitor-status.enum';
import { TypeOrmOptionsClass } from '@/utils/typeorm.options';
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
import { UserResponse } from './user-response.entity';
import { UserService } from './user.service';
import { RefreshTokenEntity } from './refreshtoken.entity';
import { RefreshTokenService } from './refreshtoken.service';
import { BidService } from './bid.service';
import { BidEntity } from './bid.entity';
import { WalletEntity } from './wallet.entity';
import { WalletService } from './wallet.service';
import { ActService } from './act.service';
import { ActEntity } from './act.entity';
import { MonitorGroupEntity } from './monitor.group.entity';

@Module({
  imports: [
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
      UserResponse,
      RefreshTokenEntity,
      BidEntity,
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
    BidService,
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
    BidService,
    WalletService,
  ],
})
export class DatabaseModule implements OnModuleInit {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,
  ) {}

  async onModuleInit(): Promise<void> {
    this.manager.transaction(async (manager) => {
      const monitors = await manager.find(MonitorEntity, {
        where: {
          status: MonitorStatus.Online,
        },
        select: ['id'],
        relations: {},
        loadEagerRelations: false,
      });
      if (monitors.length > 0) {
        await manager.update(MonitorEntity, monitors, {
          status: MonitorStatus.Offline,
        });
      }
    });
  }
}
