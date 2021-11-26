import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailgunModule } from 'nestjs-mailgun';

import { MailGunService } from '@/mailgun/mailgun.service';

// TODO: заменить это все микросервисной архитектурой

@Global()
@Module({
  imports: [
    MailgunModule.forAsyncRoot({
      imports: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        DOMAIN: configService.get<string>('MAIL_API_DOMAIN'),
        API_KEY: configService.get<string>('MAIL_API_KEY'),
        HOST: configService.get<string>('MAIL_API_HOST', 'api.eu.mailgun.net'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailGunService],
  exports: [MailGunService],
})
export class MailGunModule {}
