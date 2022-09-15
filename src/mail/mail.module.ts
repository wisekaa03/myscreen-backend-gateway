import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailgunModule } from 'nestjs-mailgun';

import { MailService } from './mail.service';

// TODO: заменить это все микросервисной архитектурой

@Global()
@Module({
  imports: [
    MailgunModule.forAsyncRoot({
      useFactory: async (configService: ConfigService) => ({
        username: 'api',
        key: configService.get<string>('MAILGUN_API_KEY', ''),
        public_key: configService.get<string>('MAILGUN_PUBLIC_KEY', ''),
        timeout: Number(configService.get<string>('MAILGUN_TIMEOUT', '3000')),
        url: `https://${configService.get<string>(
          'MAILGUN_API_HOST',
          'api.mailgun.net',
        )}`,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
