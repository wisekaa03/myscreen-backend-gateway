import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { DatabaseModule } from '@/database/database.module';
import { AuthController } from '@/endpoint/auth/auth.controller';
import { AuthService } from '@/endpoint/auth/auth.service';
import { JwtStrategy } from '@/endpoint/auth/jwt.strategy';

import { MonitorController } from '@/endpoint/monitors.controller';
import { VideoController } from '@/endpoint/video.controller';
import { EditorController } from '@/endpoint/editor.controller';
import { FileController } from '@/endpoint/file.controller';
import { MediaController } from '@/endpoint/media.controller';
import { FolderController } from '@/endpoint/folder.controller';
import { UploadController } from '@/endpoint/upload.controller';
import { UserController } from '@/endpoint/user.controller';
import { OrderController } from '@/endpoint/order.controller';
import { PaymentController } from '@/endpoint/payment.controller';
import { UptimeController } from '@/endpoint/uptime.controller';
import { PlaylistController } from '@/endpoint/playlist.controller';
import { LogController } from '@/endpoint/log.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES'),
        },
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
  ],

  controllers: [
    AuthController,
    MonitorController,
    VideoController,
    EditorController,
    FileController,
    MediaController,
    FolderController,
    UploadController,
    UserController,
    OrderController,
    PaymentController,
    UptimeController,
    PlaylistController,
    LogController,
  ],

  providers: [Logger, AuthService, JwtStrategy],
})
export class EndpointModule {}
