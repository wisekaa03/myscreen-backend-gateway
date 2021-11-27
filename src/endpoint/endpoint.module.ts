import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { DatabaseModule } from '@/database/database.module';

import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';

import { MediaController } from './media/media.controller';
import { MediaService } from './media/media.service';

import { MonitorController } from './monitors.controller';
import { VideoController } from './video.controller';
import { EditorController } from './editor.controller';
import { FileController } from './file.controller';
import { FolderController } from './folder.controller';
import { UploadController } from './upload.controller';
import { UserController } from './user.controller';
import { OrderController } from './order.controller';
import { PaymentController } from './payment.controller';
import { UptimeController } from './uptime.controller';
import { PlaylistController } from './playlist.controller';
import { LogController } from './log.controller';

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

  providers: [Logger, JwtStrategy, AuthService, MediaService],
})
export class EndpointModule {}
