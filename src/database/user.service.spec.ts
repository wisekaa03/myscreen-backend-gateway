import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { FindOneOptions, FindOptionsWhere } from 'typeorm';

import { Observable } from 'rxjs';
import { I18nService } from 'nestjs-i18n';
import { MAIL_SERVICE } from '@/constants';
import { CRUD, UserPlanEnum, UserRoleEnum } from '@/enums';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { getFullName } from '@/utils/full-name';
import { UserResponse } from './user-response.entity';
import { RegisterRequest } from '@/dto';

describe(UserService.name, () => {
  let service: UserService;

  let testUser: Partial<UserResponse>;
  let monitorTestDemo: Partial<UserResponse>;

  const mockRepository = jest.fn(() => ({
    findOne: async ({ where }: FindOneOptions<UserEntity>) => {
      if ((where as FindOptionsWhere<UserEntity>)?.email === testUser.email) {
        return Promise.resolve(null);
      }
      return Promise.resolve(testUser);
    },
    findOneBy: async () => Promise.resolve(testUser),
    findAndCount: async () => Promise.resolve([]),
    save: async () => Promise.resolve([]),
    create: (value: any) => value,
    update: (value: any) => ({ affected: 1, raw: value }),
    remove: async () => Promise.resolve([]),
    sendWelcomeMessage: async () => Promise.resolve({}),
    sendVerificationCode: async () => Promise.resolve({}),
    get: (key: string, defaultValue?: string) => defaultValue,
    getOrThrow: (key: string) => key,
    emit: async (event: string, data: unknown) =>
      new Observable((s) => s.next(data)),
    send: async (id: unknown) => new Observable((s) => s.next(id)),
    t: (value: unknown) => value,
    metadata: {
      columns: [],
      relations: [],
    },
  }));

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: I18nService, useClass: mockRepository },
        { provide: ConfigService, useClass: mockRepository },
        { provide: MAIL_SERVICE, useClass: mockRepository },
        {
          provide: getRepositoryToken(UserEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(UserResponse),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    testUser = {
      id: '0000-0000-0000-0000',
      disabled: false,
      verified: false,
      email: 'postmaster@domain.com',
      role: UserRoleEnum.Administrator,
      plan: UserPlanEnum.Full,
      surname: 'Steve',
      name: 'John',
      middleName: 'Doe',
      fullName: 'Steve John Doe',
      fullNameEmail: 'Steve John Doe <postmaster@domain.com>',
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
      planValidityPeriod: Number.POSITIVE_INFINITY,
      wallet: { total: 0 },
      metrics: {
        monitors: {
          online: 0,
          offline: 0,
          empty: 0,
          user: 0,
        },
        playlists: {
          added: 0,
          played: 0,
        },
        storageSpace: {
          storage: 0,
          total: 0,
        },
      },
    };

    monitorTestDemo = {
      ...testUser,
      role: UserRoleEnum.MonitorOwner,
      plan: UserPlanEnum.Demo,
      createdAt: dayjs().subtract(100).toDate(),
    };
  });

  test('Full name of a test user', () => {
    const testUserFullNameGetFullName = getFullName(testUser);
    expect(testUserFullNameGetFullName).toBe(
      'Steve John Doe <postmaster@domain.com>',
    );
    const testUserFullNameEmail = testUser.fullNameEmail;
    expect(testUserFullNameEmail).toBe(
      'Steve John Doe <postmaster@domain.com>',
    );
  });

  describe('User Monitor-owner Demo permissions', () => {
    test('Administrator and Accountant users', async () => {
      expect(
        service.verify(
          {
            ...monitorTestDemo,
            role: UserRoleEnum.Administrator,
          } as UserResponse,
          'auth',
          'login',
          CRUD.READ,
        ),
      ).toBe(true);
      expect(
        service.verify(
          {
            ...monitorTestDemo,
            role: UserRoleEnum.Accountant,
          } as UserResponse,
          'invoice',
          'get',
          CRUD.READ,
        ),
      ).toBe(true);
    });

    test('Access to Auth and invoice', () => {
      expect(
        service.verify(
          monitorTestDemo as UserResponse,
          'auth',
          'get',
          CRUD.READ,
        ),
      ).toBe(true);
      expect(
        service.verify(
          monitorTestDemo as UserResponse,
          'invoice',
          'get',
          CRUD.READ,
        ),
      ).toBe(true);
    });

    test('Count of monitors: 5', async () => {
      // Количество мониторов: 5
      expect(() =>
        service.verify(
          {
            ...monitorTestDemo,
            countMonitors: '5',
            metrics: {
              monitors: {
                offline: 5,
                user: 5,
              },
              storageSpace: {
                storage: 0,
              },
            },
          } as UserResponse,
          'monitor',
          'create',
          CRUD.CREATE,
        ),
      ).toThrow();

      expect(
        service.verify(
          {
            ...monitorTestDemo,
            countMonitors: '5',
            metrics: {
              monitors: {
                offline: 5,
                user: 5,
              },
              storageSpace: {
                storage: 0,
              },
            },
          } as UserResponse,
          'monitor',
          'get',
          CRUD.READ,
        ),
      ).toBe(true);

      expect(
        service.verify(
          {
            ...monitorTestDemo,
            countMonitors: '5',
            metrics: {
              monitors: {
                offline: 5,
                user: 5,
              },
              storageSpace: {
                storage: 0,
              },
            },
          } as UserResponse,
          'files',
          'get',
          CRUD.READ,
        ),
      ).toBe(true);
    });

    test('Access to create monitors: 14 days', async () => {
      const createdAt = dayjs().subtract(14).toDate();
      // Доступ к управлению мониторами: 14 дней
      expect(
        service.verify(
          {
            ...monitorTestDemo,
            metrics: {
              monitors: { online: 0, offline: 0, empty: 0, user: 4 },
              playlists: { added: 0, played: 0 },
              storageSpace: { storage: 0, total: 1000000 },
            },
            createdAt,
          } as UserResponse,
          'monitor',
          'create',
          CRUD.CREATE,
        ),
      ).toBe(true);
    });

    test('Access to create monitors: 15 days', async () => {
      expect(() =>
        service.verify(
          {
            ...monitorTestDemo,
            countMonitors: '4',
            createdAt: dayjs().subtract(15).toDate(),
          } as UserResponse,
          'monitor',
          'create',
          CRUD.CREATE,
        ),
      ).not.toBe(true);
    });

    test('Access to create files: 28 days', async () => {
      // Доступ к файлам: 28 дней
      expect(
        service.verify(
          {
            ...monitorTestDemo,
            createdAt: dayjs().subtract(28).toDate(),
          } as UserResponse,
          'file',
          'create',
          CRUD.CREATE,
        ),
      ).toBe(true);
    });

    test('Access to create files: 29 days', async () => {
      expect(() =>
        service.verify(
          {
            ...monitorTestDemo,
            createdAt: dayjs().subtract(29).toDate(),
          } as UserResponse,
          'file',
          'create',
          CRUD.CREATE,
        ),
      ).not.toBe(true);
    });
  });

  test('Register user', async () => {
    process.env.NODE_ENV = 'production';
    const testUserRegister = {
      ...testUser,
      password: 'aA1!aaaa',
    };
    const user = await service.register(testUserRegister as RegisterRequest);
    expect(user).toStrictEqual(testUser);
  });

  test('Update user', async () => {
    process.env.NODE_ENV = 'production';
    const testUserUpdate = {
      ...testUser,
      email: 'postmaster@domain.us',
      password: 'aA1!aaaa',
    };
    const user = await service.update('0000-0000-0000-0000', testUserUpdate);
    expect(user).toBeDefined();
  });

  // TODO: should inspect:
  // TODO: - delete, create, findAll, findByEmail, findById
  // TODO: - forgotPasswordInvitation, forgotPasswordVerify, validateCredentials
});
