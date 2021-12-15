import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Module } from 'nestjs-s3';

import { TypeOrmOptionsClass } from '@/shared/typeorm.options';
import { S3ModuleOptionsClass } from '@/shared/s3-module-options-class';
import { MailModule } from '@/mail/mail.module';
import { EditorEntity } from './editor.entity';
import { FolderEntity } from './folder.entity';
import { FolderService } from './folder.service';
import { MediaEntity } from './media.entity';
import { MediaService } from './media.service';
import { MonitorEntity } from './monitor.entity';
import { OrderEntity } from './order.entity';
import { PaymentLogsEntity } from './payment-log.entity';
import { PaymentEntity } from './payment.entity';
import { PlaylistEntity } from './playlist.entity';
import { PlaylistService } from './playlist.service';
import { UptimeMonitoringEntity } from './uptime-monitoring.entity';
import { UserEntity } from './user.entity';
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
      FolderEntity,
      MediaEntity,
      MonitorEntity,
      OrderEntity,
      PaymentLogsEntity,
      PaymentEntity,
      PlaylistEntity,
      UptimeMonitoringEntity,
      UserEntity,
      RefreshTokenEntity,
    ]),

    S3Module.forRootAsync({
      useClass: S3ModuleOptionsClass,
      inject: [ConfigService],
    }),
  ],

  providers: [
    Logger,
    UserService,
    RefreshTokenService,
    FolderService,
    MediaService,
    PlaylistService,
  ],

  exports: [
    UserService,
    RefreshTokenService,
    FolderService,
    MediaService,
    PlaylistService,
  ],
})
export class DatabaseModule {}
