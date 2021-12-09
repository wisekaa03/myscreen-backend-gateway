import multer from 'multer';
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { MailModule } from '@/mail/mail.module';
import { DatabaseModule } from '@/database/database.module';
import { EndpointModule } from '@/endpoint/endpoint.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: multer.diskStorage({ destination: './upload ' }),
      }),
      inject: [ConfigService],
    }),
    MailModule,
    DatabaseModule,
    EndpointModule,
  ],
  providers: [Logger],
})
export class AppModule {}
