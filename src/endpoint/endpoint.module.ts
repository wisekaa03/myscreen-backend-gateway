import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { S3Module } from 'nestjs-s3';
import { MulterModule } from '@nestjs/platform-express';

import { MulterModuleOptionsClass } from '@/shared/multer-module-options-class';
import { DatabaseModule } from '@/database/database.module';

import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { UserController } from './user.controller';
import { MediaController } from './media.controller';
import { MonitorController } from './monitors.controller';
import { VideoController } from './video.controller';
import { EditorController } from './editor.controller';
import { FileController } from './file.controller';
import { FolderController } from './folder.controller';
import { UploadController } from './upload.controller';
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

    S3Module.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        config: {
          endpoint: configService.get('AWS_HOST', 'storage.yandexcloud.net'),
          accessKey: configService.get('AWS_ACCESS_KEY'),
          secretKey: configService.get('AWS_SECRET_KEY'),
          region: configService.get('AWS_REGION', 'ru-central1'),
          apiVersion: '',
          httpOptions: {
            timeout: 10000,
            connectTimeout: 10000,
          },
        },
      }),
      inject: [ConfigService],
    }),

    MulterModule.registerAsync({
      imports: [S3Module, DatabaseModule],
      useClass: MulterModuleOptionsClass,
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

  providers: [Logger, JwtStrategy, AuthService],
})
export class EndpointModule {}
