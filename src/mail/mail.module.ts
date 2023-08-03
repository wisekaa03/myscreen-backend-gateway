import { Global, Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { MailService } from './mail.service';
import { PrintModule } from '@/print/print.module';
import { MailLogger } from '@/utils/mail.logger';
import { DatabaseModule } from '@/database/database.module';

// TODO: заменить это все микросервисной архитектурой

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST', 'smtp.timeweb.ru'),
          port: parseInt(configService.get('MAIL_PORT', '465'), 10),
          secure: true,
          auth: {
            user: configService.get('MAIL_USER', 'admin'),
            pass: configService.get('MAIL_PASS', '12345678'),
          },
          dkim: configService.get('MAIL_PRIVATE_KEY') && {
            domainName: configService.get('MAIL_DOMAIN'),
            keySelector: configService.get('MAIL_KEY_SELECTOR'),
            privateKey: configService.get('MAIL_PRIVATE_KEY'),
          },
          logger: new MailLogger(),
          tls: {
            rejectUnauthorized: false,
          },
        },
        defaults: {
          from: configService.get('MAIL_FROM'),
        },
        template: {
          dir: 'templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),

    forwardRef(() => DatabaseModule),
    forwardRef(() => PrintModule),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
