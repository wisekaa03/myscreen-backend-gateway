import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { MulterModuleOptionsClass } from '@/utils/multer-module-options-class';
import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/database/database.module';
import { WSModule } from '@/websocket/ws.module';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { FileController } from './file.controller';
import { MonitorController } from './monitor.controller';
import { EditorController } from './editor.controller';
import { FolderController } from './folder.controller';
import { InvoiceController } from './invoice.controller';
import { PlaylistController } from './playlist.controller';
import { StatisticsController } from './statistics.controller';
import { RequestController } from './request.controller';
import { CrontabController } from './crontab.controller';

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: MulterModuleOptionsClass,
      inject: [ConfigService],
    }),
    AuthModule,
    DatabaseModule,
    WSModule,
  ],

  controllers: [
    AuthController,
    MonitorController,
    EditorController,
    FileController,
    FolderController,
    UserController,
    InvoiceController,
    PlaylistController,
    StatisticsController,
    RequestController,
    CrontabController,
  ],

  providers: [Logger],
})
export class EndpointModule {}
