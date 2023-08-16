import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';

import { MailService } from './mail.service';
import { PrintService } from '@/print/print.service';
import { UserService } from '@/database/user.service';

const email = 'foo@baz.bar';
const data = { data: 'body' };

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  remove: async () => Promise.resolve([]),
  sendMail: async () => Promise.resolve(data),
  get: (key: string, defaultValue?: string) => defaultValue,
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(MailService.name, () => {
  let mailService: MailService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: PrintService, useClass: mockRepository },
        { provide: MailerService, useClass: mockRepository },
        { provide: UserService, useClass: mockRepository },
        { provide: ConfigService, useClass: mockRepository },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(mailService).toBeDefined();
  });

  it('sendWelcomeMessage: should give the expected result', async () => {
    const sendWelcome = await mailService.sendWelcomeMessage(email);
    expect(sendWelcome).toEqual(data);
  });

  it('sendVerificationCode: should give the expected result', async () => {
    const sendVerificationCode = await mailService.sendVerificationCode(
      email,
      'secret',
    );
    expect(sendVerificationCode).toEqual(data);
  });

  it('forgotPassword: should give the expected result', async () => {
    const forgotPassword = await mailService.forgotPassword(email, 'secret');
    expect(forgotPassword).toEqual(data);
  });
});
