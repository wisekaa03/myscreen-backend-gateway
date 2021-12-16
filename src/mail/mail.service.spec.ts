/** @format */

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailgunService } from 'nestjs-mailgun';
import { MailService } from './mail.service';

const data = { data: 'body' };

describe(MailService.name, () => {
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'MAILGUN_API_DOMAIN') {
                return 'baz.bar';
              }
              return null;
            }),
          },
        },
        {
          provide: MailgunService,
          useValue: {
            createEmail: jest.fn(async () => data),
          },
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(mailService).toBeDefined();
  });

  it('sendWelcomeMessage: should give the expected result', async () => {
    const sendWelcome = await mailService.sendWelcomeMessage('foo@baz.bar');
    expect(sendWelcome).toEqual(data);
  });

  it('sendVerificationCode: should give the expected result', async () => {
    const sendVerificationCode = await mailService.sendVerificationCode(
      'foo@baz.bar',
      'secret',
    );
    expect(sendVerificationCode).toEqual(data);
  });

  it('forgotPassword: should give the expected result', async () => {
    const forgotPassword = await mailService.forgotPassword(
      'foo@baz.bar',
      'secret',
    );
    expect(forgotPassword).toEqual(data);
  });
});
