import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MailModule } from '@/mail/mail.module';
import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/auth/auth.module';
import { EndpointModule } from '@/endpoint/endpoint.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MailModule,
    DatabaseModule,
    AuthModule,
    EndpointModule,
  ],
  providers: [Logger],
})
export class AppModule {}
