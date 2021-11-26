import { Injectable, Logger } from '@nestjs/common';
import { MailgunService } from 'nestjs-mailgun';

import { UserEntity } from '@/database/user.entity';

@Injectable()
export class MailGunService {
  logger = new Logger(MailGunService.name);

  constructor(private mailgunService: MailgunService) {}

  async sendWelcomeMessage(user: UserEntity): Promise<void> {
    // eslint-disable-next-line no-debugger
    debugger;
  }

  async sendVerificationCode(user: UserEntity, verify: string): Promise<void> {
    // eslint-disable-next-line no-debugger
    debugger;
  }
}
