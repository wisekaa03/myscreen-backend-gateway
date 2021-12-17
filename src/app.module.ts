import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { S3Module } from 'nestjs-s3';

import { S3ModuleOptionsClass } from '@/shared/s3-module-options-class';
import { MulterModuleOptionsClass } from '@/shared/multer-module-options-class';
import { MailModule } from '@/mail/mail.module';
import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/auth/auth.module';
import { EndpointModule } from '@/endpoint/endpoint.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MailModule,
    MulterModule.registerAsync({
      useClass: MulterModuleOptionsClass,
      inject: [ConfigService],
    }),
    S3Module.forRootAsync({
      useClass: S3ModuleOptionsClass,
      inject: [ConfigService],
    }),

    DatabaseModule,
    AuthModule,
    EndpointModule,
  ],
  providers: [Logger],
})
export class AppModule {}
