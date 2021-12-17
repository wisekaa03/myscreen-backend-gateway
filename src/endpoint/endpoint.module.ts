import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '@/auth/auth.module';

import { MulterModuleOptionsClass } from '@/shared/multer-module-options-class';
import { DatabaseModule } from '@/database/database.module';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { MediaController } from './media.controller';
import { MonitorController } from './monitor.controller';
import { EditorController } from './editor.controller';
import { FolderController } from './folder.controller';
import { OrderController } from './order.controller';
import { PaymentController } from './payment.controller';
import { UptimeController } from './uptime.controller';
import { PlaylistController } from './playlist.controller';
import { LogController } from './log.controller';

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: MulterModuleOptionsClass,
      inject: [ConfigService],
    }),
    AuthModule,
    DatabaseModule,
  ],

  controllers: [
    AuthController,
    MonitorController,
    EditorController,
    MediaController,
    FolderController,
    UserController,
    OrderController,
    PaymentController,
    UptimeController,
    PlaylistController,
    LogController,
  ],

  providers: [Logger],
})
export class EndpointModule {}
