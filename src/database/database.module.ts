import { Module, Logger, OnModuleInit, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager, MoreThan } from 'typeorm';
import { InjectEntityManager, TypeOrmModule } from '@nestjs/typeorm';

import { MonitorStatus } from '@/enums/monitor-status.enum';
import { TypeOrmOptionsClass } from '@/utils/typeorm.options';
import { EditorEntity } from './editor.entity';
import { EditorLayerEntity } from './editor-layer.entity';
import { EditorService } from './editor.service';
import { FolderEntity } from './folder.entity';
import { FolderService } from './folder.service';
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
import { UserEntity } from './user.entity';
import { UserExtView } from './user-ext.view';
import { FileExtView } from './file-ext.view';
import { FolderExtView } from './folder-ext.view';
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
import { WsStatistics } from './ws.statistics';
import { MonitorStatisticsService } from './monitor-statistics.service';
import { MonitorStatisticsEntity } from './monitor-statistics.entity';
import { MonitorOnlineEntity } from './monitor-online.entity';
import { MonitorOnlineService } from './monitor-online.service';
import { EditorLayerSubscriber } from './editor-layer.subscriber';
import { FileExtSubscriber } from './file-ext.subsciber';
import { FolderExtSubscriber } from './folder-ext.subsciber';
import { MonitorSubscriber } from './monitor.subsciber';
import { UserExtSubscriber } from './user-ext.subsciber';

@Global()
@Module({
  imports: [
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
      MonitorFavoriteEntity,
      MonitorGroupEntity,
      InvoiceEntity,
      PlaylistEntity,
      UserEntity,
      RefreshTokenEntity,
      BidEntity,
      WalletEntity,
      ActEntity,
      MonitorStatisticsEntity,
      MonitorOnlineEntity,
      UserExtView,
      FileExtView,
      FolderExtView,
    ]),
  ],

  providers: [
    Logger,
    ActService,
    BidService,
    EditorService,
    FileService,
    FolderService,
    InvoiceService,
    MonitorService,
    PlaylistService,
    RefreshTokenService,
    UserService,
    WalletService,
    WsStatistics,
    MonitorStatisticsService,
    MonitorOnlineService,

    EditorLayerSubscriber,
    FileExtSubscriber,
    FolderExtSubscriber,
    MonitorSubscriber,
    UserExtSubscriber,
  ],

  exports: [
    ActService,
    BidService,
    EditorService,
    FileService,
    FolderService,
    InvoiceService,
    MonitorService,
    PlaylistService,
    RefreshTokenService,
    UserService,
    WalletService,
    WsStatistics,
    MonitorStatisticsService,
    MonitorOnlineService,
  ],
})
export class DatabaseModule implements OnModuleInit {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.entityManager.transaction('REPEATABLE READ', async (manager) => {
      const monitors = await manager.find(MonitorEntity, {
        where: [
          {
            status: MonitorStatus.Online,
          },
          { groupOnlineMonitors: MoreThan(0) },
        ],
        select: ['id'],
        relations: {},
        loadEagerRelations: false,
      });
      if (monitors.length > 0) {
        await manager.update(MonitorEntity, monitors, {
          status: MonitorStatus.Offline,
          groupOnlineMonitors: 0,
        });
      }

      await manager.query('DROP VIEW IF EXISTS folder_file_number_entity');
      await manager.query('DROP VIEW IF EXISTS user_response');
      await manager.query(
        'UPDATE "folder" SET "system" = false WHERE "folder"."system" = NULL',
      );
    });
  }
}
