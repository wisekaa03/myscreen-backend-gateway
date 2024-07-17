import { Module, Logger, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { MulterModuleOptionsClass } from '@/utils/multer-module-options-class';
import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/database/database.module';
import { RedirectMiddleware } from '@/exception/redirect.middleware';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { FileController } from './file.controller';
import { MonitorController } from './monitor.controller';
import { EditorController } from './editor.controller';
import { FolderController } from './folder.controller';
import { InvoiceController } from './invoice.controller';
import { PlaylistController } from './playlist.controller';
import { StatisticsController } from './statistics.controller';
import { BidController } from './bid.controller';
import { CrontabController } from './crontab.controller';
import { ConstantsController } from './constants.controller';
import { WalletController } from './wallet.controller';

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
    FileController,
    FolderController,
    UserController,
    InvoiceController,
    PlaylistController,
    StatisticsController,
    BidController,
    CrontabController,
    ConstantsController,
    WalletController,
  ],

  providers: [Logger],
})
export class EndpointModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RedirectMiddleware).forRoutes('*');
  }
}
