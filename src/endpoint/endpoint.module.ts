import { Module, Logger } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
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
  imports: [AuthModule, DatabaseModule],

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
