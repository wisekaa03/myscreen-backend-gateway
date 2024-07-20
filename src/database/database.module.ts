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
import { WsStatistics } from './ws.statistics';

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
      FolderFileNumberEntity,
      FileEntity,
      FilePreviewEntity,
      MonitorEntity,
      MonitorFavoriteEntity,
      MonitorGroupEntity,
      InvoiceEntity,
      PlaylistEntity,
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
  ],
})
export class DatabaseModule implements OnModuleInit {
  constructor(
    @InjectEntityManager()
    private readonly manager: EntityManager,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.manager.transaction(async (manager) => {
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

      await manager.query('DROP TABLE IF EXISTS monitor_files_file');
    });
  }
}
