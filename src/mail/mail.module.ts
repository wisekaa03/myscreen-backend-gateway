import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailgunModule } from 'nestjs-mailgun';

import { MailService } from '@/mail/mail.service';

// TODO: заменить это все микросервисной архитектурой

@Global()
@Module({
  imports: [
    MailgunModule.forAsyncRoot({
      imports: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        domain: configService.get<string>('MAILGUN_API_DOMAIN'),
        apiKey: configService.get<string>('MAILGUN_API_KEY'),
        publicApiKey: configService.get<string>('MAILGUN_PUBLIC_KEY'),
        host: configService.get<string>('MAILGUN_API_HOST', 'api.mailgun.net'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
