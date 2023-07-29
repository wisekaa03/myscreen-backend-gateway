import { Global, Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { MailService } from './mail.service';
import { PrintModule } from '@/print/print.module';

// TODO: заменить это все микросервисной архитектурой

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST') || 'localhost',
          port: parseInt(configService.get<string>('MAIL_PORT') || '465', 10),
          secure: true,
          auth: {
            user: configService.get<string>('MAIL_USER') || 'admin',
            pass: configService.get<string>('MAIL_PASS') || '12345678',
          },
          logger: true,
          tls: {
            rejectUnauthorized: false,
          },
        },
        defaults: {
          from: '"MyScreen" <postmaster@mail.myscreen.ru>',
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

    forwardRef(() => PrintModule),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
