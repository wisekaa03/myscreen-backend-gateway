import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { addDays, subDays } from 'date-fns';
import { MailService } from '@/mail/mail.service';
import { UserEntity } from './user.entity';
import { UserExtEntity } from './user-ext.entity';
import { UserService } from './user.service';
import { CRUD, UserPlanEnum, UserRoleEnum } from '@/enums';

const testUser: UserExtEntity = {
  id: '0000-0000-0000-0000',
  disabled: false,
  verified: false,
  email: 'postmaster@domain.com',
  role: UserRoleEnum.Administrator,
  plan: UserPlanEnum.Full,
  surname: 'Steve',
  name: 'John',
  middleName: 'Doe',
  phoneNumber: '+78002000000',
  city: 'Krasnodar',
  country: 'RU',
  company: 'ACME corporation',
  companyLegalAddress: 'г. Краснодар, ул. Красная, д. 1',
  companyActualAddress: 'г. Краснодар, ул. Красная, д. 1',
  companyTIN: '112345678901',
  companyRRC: '112345678901',
  companyPSRN: '112345678901',
  companyPhone: '+78003000000',
  companyEmail: 'we@are.the.best',
  companyBank: 'Банк',
  companyBIC: '012345678',
  companyCorrespondentAccount: '30101810400000000000',
  companyPaymentAccount: '40802810064580000000',
  companyFax: '+78002000000',
  companyRepresentative: 'Тухбатуллина Евгеньевна Юлия',
  countMonitors: 5,
  countUsedSpace: 1000000000,
};

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  remove: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(UserService.name, () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: ConfigService, useClass: mockRepository },
        { provide: MailService, useClass: mockRepository },
        {
          provide: getRepositoryToken(UserEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(UserExtEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('Full name of a test user', () => {
    const testUserFullName = UserService.fullName(testUser);
    expect(testUserFullName).toBe('Steve John Doe <postmaster@domain.com>');
  });

  describe('User Monitor-owner Demo permissions', () => {
    const monitorTestDemo = {
      ...testUser,
      role: UserRoleEnum.MonitorOwner,
      plan: UserPlanEnum.Demo,
      countMonitors: 5,
      countUsedSpace: 1000000000,
      createdAt: subDays(new Date(), 100),
    };

    test('Access to Auth and invoice', () => {
      try {
        service.verify('auth', CRUD.READ, monitorTestDemo);
      } catch (error: unknown) {
        expect(false).toBe(true);
      }
      try {
        service.verify('invoice', CRUD.READ, monitorTestDemo);
      } catch (error: unknown) {
        expect(false).toBe(true);
      }
    });

    test('Count of monitors: 5', () => {
      // Количество мониторов: 5
      try {
        service.verify('monitor', CRUD.CREATE, {
          ...monitorTestDemo,
          countMonitors: 5,
        });
        expect(false).toBe(true);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ForbiddenException);
      }
      try {
        service.verify('files', CRUD.READ, {
          ...monitorTestDemo,
          countMonitors: 5,
        });
      } catch (error: unknown) {
        expect(false).toBe(true);
      }
    });

    test('Access to create monitors: 14 days', () => {
      // Доступ к управлению мониторами: 14 дней
      try {
        service.verify('monitor', CRUD.CREATE, {
          ...monitorTestDemo,
          countMonitors: 4,
          createdAt: subDays(Date.now(), 14),
        });
      } catch (error: unknown) {
        expect(false).toBe(true);
      }
      try {
        service.verify('monitor', CRUD.CREATE, {
          ...monitorTestDemo,
          countMonitors: 4,
          createdAt: subDays(Date.now(), 15),
        });
        expect(false).toBe(true);
      } catch (error: unknown) {
        expect(error).toBeDefined();
      }
    });

    test('Access to create files: 28 days', () => {
      // Доступ к файлам: 28 дней
      try {
        service.verify('file', CRUD.CREATE, {
          ...monitorTestDemo,
          createdAt: subDays(Date.now(), 28),
        });
      } catch (error: unknown) {
        expect(false).toBe(true);
      }
      try {
        service.verify('file', CRUD.CREATE, {
          ...monitorTestDemo,
          createdAt: subDays(Date.now(), 29),
        });
        expect(false).toBe(true);
      } catch (error: unknown) {
        expect(error).toBeDefined();
      }
    });
  });

  // TODO: should inspect:
  // TODO: - update, delete, create, findAll, findByEmail, findById
  // TODO: - forgotPasswordInvitation, forgotPasswordVerify, validateCredentials
});
