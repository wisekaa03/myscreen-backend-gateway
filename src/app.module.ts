import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypeOrmOptionsService } from '@/shared/typeorm.options';

import { EditorModule } from '@/editor/editor.module';
import { FileModule } from '@/file/file.module';
import { MediaModule } from '@/media/media.module';
import { MonitorModule } from '@/monitor/monitor.module';
import { PaymentModule } from '@/payment/payment.module';
import { PlaylistModule } from '@/playlist/playlist.module';
import { UptimeMonitoringModule } from '@/uptime-monitoring/uptime-monitoring.module';
import { UserModule } from '@/user/user.module';
import { VideoModule } from '@/video/video.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      useClass: TypeOrmOptionsService,
    }),

    EditorModule,
    FileModule,
    MediaModule,
    MonitorModule,
    PaymentModule,
    PlaylistModule,
    UptimeMonitoringModule,
    UserModule,
    VideoModule,
  ],
  providers: [Logger],
})
export class AppModule {}
