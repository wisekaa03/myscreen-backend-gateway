import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock } from '@golevelup/ts-jest';
import { getRepositoryToken } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { FindOneOptions, FindOptionsWhere } from 'typeorm';

import { Observable } from 'rxjs';
import { I18nService } from 'nestjs-i18n';
import { CRUD, UserPlanEnum, UserRoleEnum } from '@/enums';
import { RegisterRequest } from '@/dto';
import { getFullName } from '@/utils/full-name';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { UserExtView } from './user-ext.view';
import { FileService } from './file.service';
import { FileEntity } from './file.entity';

const idMock = '00000000-0000-0000-0000-000000000000';

describe(UserService.name, () => {
  let service: UserService;

  let testUser: Partial<UserExtView>;
  let monitorTestDemo: Partial<UserExtView>;

  const mockRepository = jest.fn(() => ({
    findOne: async ({ where }: FindOneOptions<UserEntity>) => {
      if ((where as FindOptionsWhere<UserEntity>).email === testUser.email) {
        return Promise.resolve(null);
      }
      if (
        (Array.isArray(where) && where.some((w) => w.disabled === true)) ||
        (!Array.isArray(where) && where?.disabled === true)
      ) {
        return Promise.resolve(null);
      }
      return Promise.resolve(testUser);
    },
    findOneBy: async () => Promise.resolve(testUser),
    findAndCount: async () => Promise.resolve([]),
    save: async () => Promise.resolve([]),
    create: (value: any) => value,
    update: async (value: any, rawBody: any) =>
      Promise.resolve({ affected: 1, raw: rawBody }),
    remove: async () => Promise.resolve([]),
    sendWelcomeMessage: async () => Promise.resolve({}),
    sendVerificationCode: async () => Promise.resolve({}),
    get: (key: string, defaultValue?: string) => defaultValue,
    getOrThrow: (key: string) => key,
    emit: async (event: string, data: unknown) =>
      new Observable((s) => s.next(data)),
    send: async (id: unknown) => new Observable((s) => s.next(id)),
    t: (value: unknown) => value,
    countMonitors: async (userId: string) => Promise.resolve(0),
    sum: async (userId: string) => Promise.resolve(0),
    metadata: {
      columns: [],
      relations: [],
    },
  }));

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: FileService, useClass: mockRepository },
        { provide: I18nService, useClass: mockRepository },
        { provide: ConfigService, useClass: mockRepository },
        {
          provide: getRepositoryToken(UserEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(UserExtView),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FileEntity),
          useClass: mockRepository,
        },
        { provide: AmqpConnection, useValue: createMock<AmqpConnection>() },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    testUser = {
      id: idMock,
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
      createdAt: dayjs().subtract(100, 'days').toDate(),
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
      const userAdmin = service.verify(
        {
          ...monitorTestDemo,
          role: UserRoleEnum.Administrator,
        } as UserExtView,
        'auth',
        'login',
        CRUD.READ,
      );
      await expect(userAdmin).resolves.toBe(true);

      const userAccountant = service.verify(
        {
          ...monitorTestDemo,
          role: UserRoleEnum.Accountant,
        } as UserExtView,
        'invoice',
        'get',
        CRUD.READ,
      );
      await expect(userAccountant).resolves.toBe(true);
    });

    test('Access to Auth and invoice', async () => {
      const verifyAuthGet = service.verify(
        monitorTestDemo as UserExtView,
        'auth',
        'get',
        CRUD.READ,
      );
      await expect(verifyAuthGet).resolves.toBe(true);

      const verifyInvoiceGet = service.verify(
        monitorTestDemo as UserExtView,
        'invoice',
        'get',
        CRUD.READ,
      );
      await expect(verifyInvoiceGet).resolves.toBe(true);
    });

    test('Count of monitors: 5. Monitor create', async () => {
      // Количество мониторов: 5
      const verifyMonitorCreate = service.verify(
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
        } as UserExtView,
        'monitor',
        'create',
        CRUD.CREATE,
      );
      await expect(verifyMonitorCreate).rejects.toThrow();
    });

    test('Count of monitors: 5. Monitors get', async () => {
      const verifyMonitorGet = service.verify(
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
        } as UserExtView,
        'monitor',
        'get',
        CRUD.READ,
      );
      await expect(verifyMonitorGet).resolves.toBe(true);
    });

    test('Count of monitors: 5. Files get', async () => {
      const verifyFilesGet = service.verify(
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
        } as UserExtView,
        'files',
        'get',
        CRUD.READ,
      );
      await expect(verifyFilesGet).resolves.toBe(true);
    });

    test('Access to create monitors: 14 days', async () => {
      const createdAt = dayjs().subtract(14, 'days').toDate();
      // Доступ к управлению мониторами: 14 дней
      const verifyMonitorCreate = service.verify(
        {
          ...monitorTestDemo,
          metrics: {
            monitors: { online: 0, offline: 0, empty: 0, user: 4 },
            playlists: { added: 0, played: 0 },
            storageSpace: { storage: 0, total: 1000000 },
          },
          createdAt,
        } as UserExtView,
        'monitor',
        'create',
        CRUD.CREATE,
      );
      await expect(verifyMonitorCreate).resolves.toBe(true);
    });

    test('Access to create monitors: 15 days', async () => {
      const verifyMonitorCreate15 = service.verify(
        {
          ...monitorTestDemo,
          countMonitors: '4',
          createdAt: dayjs().subtract(16, 'days').toDate(),
        } as UserExtView,
        'monitor',
        'create',
        CRUD.CREATE,
      );
      await expect(verifyMonitorCreate15).rejects.toThrow();
    });

    test('Access to create files: 28 days', async () => {
      // Доступ к файлам: 28 дней
      const verifyFileCreate = service.verify(
        {
          ...monitorTestDemo,
          createdAt: dayjs().subtract(28, 'days').toDate(),
        } as UserExtView,
        'file',
        'create',
        CRUD.CREATE,
      );
      await expect(verifyFileCreate).resolves.toBe(true);
    });

    test('Access to create files: 29 days', async () => {
      const verifyFileCreate29 = service.verify(
        {
          ...monitorTestDemo,
          createdAt: dayjs().subtract(30, 'days').toDate(),
        } as UserExtView,
        'file',
        'create',
        CRUD.CREATE,
      );
      await expect(verifyFileCreate29).rejects.toThrow();
    });
  });

  test('Register user', async () => {
    process.env.NODE_ENV = 'production';
    const testUserRegister = {
      ...testUser,
      password: 'aA1!aaaa',
    };
    const user = service.register(testUserRegister as RegisterRequest);
    await expect(user).resolves.toStrictEqual(testUser);
  });

  test('Update user', async () => {
    process.env.NODE_ENV = 'production';
    const testUserUpdate = {
      ...testUser,
      email: 'postmaster@domain.us',
      password: 'aA1!aaaa',
    } as UserEntity;
    const user = service.update(testUserUpdate, testUserUpdate);
    await expect(user).resolves.toBeInstanceOf(Object);
  });

  test('findById: monitor', async () => {
    const monitor = await service.findById(idMock, {
      role: UserRoleEnum.Monitor,
    });
    if (!monitor) {
      expect(true).toBe(false);
      return;
    }
    expect(monitor).toBeInstanceOf(Object);
    expect(monitor.id).toBe(idMock);
    expect(monitor.name).toBeNull();
    expect(monitor.surname).toBeNull();
    expect(monitor.middleName).toBeNull();
    expect(monitor.email).toBe('');
    expect(monitor.disabled).toBeFalsy();
    expect(monitor.verified).toBeTruthy();
    expect(monitor.verified).toBeTruthy();
    expect(monitor.role).toBe(UserRoleEnum.Monitor);
    expect(monitor.plan).toBe(UserPlanEnum.Full);
  });

  test('findById: monitor', async () => {
    const monitor = await service.findById(idMock, {
      role: UserRoleEnum.Monitor,
      where: { disabled: true },
    });
    if (!monitor) {
      expect(true).toBe(false);
      return;
    }
    expect(monitor).toBeInstanceOf(Object);
    expect(monitor.id).toBe(idMock);
    expect(monitor.name).toBeNull();
    expect(monitor.surname).toBeNull();
    expect(monitor.middleName).toBeNull();
    expect(monitor.email).toBe('');
    expect(monitor.disabled).toBeFalsy();
    expect(monitor.verified).toBeTruthy();
    expect(monitor.verified).toBeTruthy();
    expect(monitor.role).toBe(UserRoleEnum.Monitor);
    expect(monitor.plan).toBe(UserPlanEnum.Full);
  });

  test('findById: user', async () => {
    const user = await service.findById(idMock);
    if (!user) {
      expect(true).toBe(false);
      return;
    }
    expect(user).toBeInstanceOf(Object);
    expect(user.id).toBe(idMock);
    expect(user.name).toBe(testUser.name);
    expect(user.surname).toBe(testUser.surname);
    expect(user.middleName).toBe(testUser.middleName);
    expect(user.email).toBe(testUser.email);
    expect(user.disabled).toBe(testUser.disabled);
    expect(user.verified).toBe(testUser.verified);
    expect(user.role).toBe(testUser.role);
    expect(user.plan).toBe(testUser.plan);
  });

  test('findById: user disabled = true', async () => {
    const user = await service.findById(idMock, { where: { disabled: true } });
    expect(user).toBeNull();
  });

  test('findById: user disabled = false', async () => {
    const user = await service.findById(idMock, { where: { disabled: false } });
    if (!user) {
      expect(true).toBe(false);
      return;
    }
    expect(user).toBeInstanceOf(Object);
    expect(user.id).toBe(idMock);
    expect(user.name).toBe(testUser.name);
    expect(user.surname).toBe(testUser.surname);
    expect(user.middleName).toBe(testUser.middleName);
    expect(user.email).toBe(testUser.email);
    expect(user.disabled).toBe(testUser.disabled);
    expect(user.verified).toBe(testUser.verified);
    expect(user.role).toBe(testUser.role);
    expect(user.plan).toBe(testUser.plan);
  });

  test('findById: user disabled = undefined', async () => {
    const user = await service.findById(idMock, {
      where: { disabled: undefined },
    });
    if (!user) {
      expect(true).toBe(false);
      return;
    }
    expect(user).toBeInstanceOf(Object);
    expect(user.id).toBe(idMock);
    expect(user.name).toBe(testUser.name);
    expect(user.surname).toBe(testUser.surname);
    expect(user.middleName).toBe(testUser.middleName);
    expect(user.email).toBe(testUser.email);
    expect(user.disabled).toBe(testUser.disabled);
    expect(user.verified).toBe(testUser.verified);
    expect(user.role).toBe(testUser.role);
    expect(user.plan).toBe(testUser.plan);
  });
});
