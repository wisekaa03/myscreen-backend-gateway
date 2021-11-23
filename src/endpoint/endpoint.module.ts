import { Module, Logger } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from '@/endpoint/auth/auth.controller';
import { AuthService } from '@/endpoint/auth/auth.service';
import { jwtConstants } from '@/endpoint/auth/jwt.constants';
import { JwtStrategy } from '@/endpoint/auth/jwt.strategy';

import { MonitorsController } from '@/endpoint/monitors.controller';
import { VideoController } from '@/endpoint/video.controller';
import { EditorController } from '@/endpoint/editor.controller';
import { FilesController } from '@/endpoint/files.controller';
import { MediaController } from '@/endpoint/media.controller';
import { FoldersController } from '@/endpoint/folders.controller';
import { UploadController } from '@/endpoint/upload.controller';
import { UsersController } from '@/endpoint/users.controller';
import { OrdersController } from '@/endpoint/orders.controller';
import { PaymentsController } from '@/endpoint/payments.controller';
import { UptimeController } from '@/endpoint/uptime.controller';
import { PlaylistsController } from '@/endpoint/playlists.controller';
import { LogsController } from '@/endpoint/logs.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],

  controllers: [
    AuthController,
    MonitorsController,
    VideoController,
    EditorController,
    FilesController,
    MediaController,
    FoldersController,
    UploadController,
    UsersController,
    OrdersController,
    PaymentsController,
    UptimeController,
    PlaylistsController,
    LogsController,
  ],

  providers: [Logger, AuthService, JwtStrategy],
})
export class EndpointModule {}
