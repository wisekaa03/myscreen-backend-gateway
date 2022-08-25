import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { MulterModuleOptionsClass } from '@/shared/multer-module-options-class';
import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/database/database.module';
import { WSModule } from '@/websocket/ws.module';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { FileController } from './file.controller';
import { MonitorController } from './monitor.controller';
import { EditorController } from './editor.controller';
import { FolderController } from './folder.controller';
import { OrderController } from './order.controller';
import { PaymentController } from './payment.controller';
import { PaymentLogController } from './log.controller';
import { UptimeController } from './uptime.controller';
import { PlaylistController } from './playlist.controller';
import { RootController } from './root.controller';
import { StatisticsController } from './statistics.controller';
import { ApplicationController } from './application.controller';

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
    RootController,
    AuthController,
    MonitorController,
    EditorController,
    FileController,
    FolderController,
    UserController,
    OrderController,
    PaymentController,
    UptimeController,
    PlaylistController,
    PaymentLogController,
    StatisticsController,
    ApplicationController,
  ],

  providers: [Logger],
})
export class EndpointModule {}
