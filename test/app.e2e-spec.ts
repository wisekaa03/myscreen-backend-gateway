/* eslint max-len:0 */
import crypto from 'node:crypto';
import superAgent from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpAdapterHost } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Jabber from 'jabber';
import WebSocket from 'ws';
import { Logger } from 'nestjs-pino';
import { I18nValidationPipe } from 'nestjs-i18n';

import {
  AuthResponse,
  RegisterRequest,
  AuthRefreshResponse,
  LoginRequest,
  UserUpdateRequest,
  SuccessResponse,
  FoldersGetResponse,
  FolderGetResponse,
  FilesGetResponse,
  FilesUploadResponse,
  UserGetResponse,
  VerifyEmailRequest,
  ResetPasswordInvitationRequest,
  FilesGetRequest,
  AuthRefreshRequest,
  MonitorsGetRequest,
  MonitorsGetResponse,
  InvoicesGetRequest,
  InvoicesGetResponse,
  MonitorCreateRequest,
  ConstantsGetResponse,
  BidsGetRequest,
  BidsGetResponse,
  InvoiceCreateRequest,
  InvoiceGetResponse,
} from '@/dto';
import {
  BidStatus,
  MonitorCategoryEnum,
  MonitorMultiple,
  MonitorOrientation,
  MonitorStatus,
  Status,
  UserRoleEnum,
  UserStoreSpaceEnum,
} from '@/enums';
import { generateMailToken } from '@/utils/mail-token';
import { ExceptionsFilter } from '@/exception/exceptions.filter';
import { UserEntity } from '@/database/user.entity';
import { UserService } from '@/database/user.service';
import { AppModule } from '@/app.module';
import { WsAdapter } from '@/websocket/ws-adapter';
import { UserResponse } from '@/database/user-response.entity';
import { WsEvent } from '@/enums/ws-event.enum';

type UserFileEntity = UserEntity & Partial<UserResponse>;

const generatePassword = (
  length = 20,
  wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$',
) =>
  Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => wishlist[x % wishlist.length])
    .join('');

const generateCode = () =>
  generatePassword(3, '0123456789') +
  '-' +
  generatePassword(3, '0123456789') +
  '-' +
  generatePassword(3, '0123456789');

const jabber = new Jabber();
const emailAdvertiser = jabber.createEmail();
const passwordAdvertiser = generatePassword(20);
const emailMonitorOwner = jabber.createEmail();
const passwordMonitorOwner = generatePassword(20);

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  remove: async () => Promise.resolve([]),
  get: () => '',
  metadata: {
    columns: [],
    relations: [],
  },
}));

const registerRequestAdvertiser: RegisterRequest = {
  email: emailAdvertiser,
  password: passwordAdvertiser,
  role: UserRoleEnum.Advertiser,
  name: 'John',
  surname: 'Steve',
  middleName: 'Doe',
  preferredLanguage: 'ru',
  city: 'Krasnodar',
  country: 'RU',
  company: 'ACME corporation',
  phoneNumber: '+78002000000',
};

const registerRequestMonitorOwner: RegisterRequest = {
  email: emailMonitorOwner,
  password: passwordMonitorOwner,
  role: UserRoleEnum.MonitorOwner,
  name: 'John',
  surname: 'Steve',
  middleName: 'Doe',
  preferredLanguage: 'ru',
  city: 'Krasnodar',
  country: 'RU',
  company: 'ACME corporation',
  phoneNumber: '+78002000000',
};

const loginRequestAdvertiser: LoginRequest = {
  email: emailAdvertiser,
  password: passwordAdvertiser,
};

const loginRequestMonitorOwner: LoginRequest = {
  email: emailMonitorOwner,
  password: passwordMonitorOwner,
};

const updateUser: UserUpdateRequest = {
  surname: 'Steve 2',
  name: 'John 2',
  middleName: 'Doe 2',
  phoneNumber: '+78003000000',
  city: 'Krasnodar',
  country: 'RU',
  locale: 'en_US',
  preferredLanguage: 'en',
  company: 'ACME corporation',
  companyLegalAddress: 'г. Краснодар, ул. Красная, д. 1',
  companyActualAddress: 'г. Краснодар, ул. Красная, д. 1',
  companyTIN: '112345678901',
  companyRRC: '123456789',
  companyPSRN: '112345678901',
  companyPhone: '+78003000000',
  companyEmail: 'we@are.the.best',
  companyBank: 'Банк 1',
  companyBIC: '012345679',
  companyCorrespondentAccount: '30101810400000000001',
  companyPaymentAccount: '40802810064580000001',
  companyFax: '+78003000000',
  companyRepresentative: 'Тухбатуллина Евгеньевна Юлия',
};

describe('Backend API (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let userService: UserService;
  let request: TestAgent;
  let apiPath = '/api/v2';
  let logger: Logger;
  let ws1: WebSocket;
  let ws2: WebSocket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();

    const httpAdaper = app.get(HttpAdapterHost);
    configService = app.get(ConfigService);

    const logLevel = configService.get('LOG_LEVEL');
    if (logLevel === 'debug') {
      logger = app.get(Logger);
      app.useLogger(logger);
    }

    apiPath = configService.get('API_PATH', '/api/v2');
    app.setGlobalPrefix(apiPath, { exclude: ['/'] });
    app.useGlobalFilters(
      new ExceptionsFilter(httpAdaper.httpAdapter, configService),
    );
    app.useGlobalPipes(
      new I18nValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
      }),
    );
    app.useWebSocketAdapter(new WsAdapter(app));
    userService = app.get<UserService>(UserService);
    await app.listen(configService.get<number>('PORT', 8080));

    request = superAgent(app.getHttpServer());
  });

  let userAdvertiser: UserFileEntity | null;
  let userMonitorOwner: UserFileEntity | null;
  let tokenAdvertiser = '';
  let refreshTokenAdvertiser: string | undefined = '';
  let tokenMonitorOwner = '';
  let refreshTokenMonitorOwner: string | undefined = '';
  let userIdAdvertiser = '';
  let userIdMonitorOwner = '';
  let parentFolderId = '';
  let parentFolderId2 = '';
  let folderId1 = '';
  let folderId2 = '';
  let folderId3 = '';
  let mediaId1 = '';
  let monitorName1 = '';
  let monitorCode1 = '';
  let invoiceId = '';

  /**
   *
   * Авторизация advertiser /auth
   *
   */
  describe('Авторизация advertiser /auth', () => {
    /**
     * Регистрация пользователя
     */
    test('POST /auth/register (Регистрация пользователя)', async () => {
      await request
        .post(`${apiPath}/auth/register`)
        .send(registerRequestAdvertiser)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: UserGetResponse }) => {
          expect(body.data.id).toBeDefined();
          expect((body.data as any).password).toBeUndefined();
          userIdAdvertiser = body.data.id;
        });
    });

    test('POST /auth/login [email пока не подтвержден] (Авторизация пользователя)', async () => {
      await request
        .post(`${apiPath}/auth/login`)
        .send(loginRequestAdvertiser)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    /**
     * Регистрация пользователя опять с теми же самыми параметрами
     */
    test('POST /auth/register [опять, с теми же самыми параметрами] (Регистрация пользователя)', async () => {
      await request
        .post(`${apiPath}/auth/register`)
        .send(registerRequestAdvertiser)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(412);
    });

    /**
     * Регистрация пользователя опять
     */
    test('POST /auth/register [email пуст, пароль пуст] (Регистрация пользователя)', async () => {
      await request
        .post(`${apiPath}/auth/register`)
        .send({ ...registerRequestAdvertiser, email: '', password: '' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Подтвердить email пользователя
     */
    test('POST /auth/email-verify (Подтвердить email пользователя)', async () => {
      userAdvertiser = await userService.findById(userIdAdvertiser);
      if (userAdvertiser) {
        const verify: VerifyEmailRequest = {
          verify: generateMailToken(
            userAdvertiser.email,
            userAdvertiser.emailConfirmKey ?? '-',
          ),
        };

        await request
          .post(`${apiPath}/auth/email-verify`)
          .send(verify)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(({ body }: { body: SuccessResponse }) => {
            expect(body.status).toBe(Status.Success);
          });
      } else {
        expect(false).toEqual(true);
      }
    });

    /**
     * Авторизация пользователя с пустым паролем
     */
    test('POST /auth/login [с пустым паролем] (Авторизация пользователя)', async () => {
      await request
        .post(`${apiPath}/auth/login`)
        .send({ email: 'foo@bar.baz' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    test('POST /auth/login [с пустым email] (Авторизация пользователя)', async () => {
      await request
        .post(`${apiPath}/auth/login`)
        .send({ password: 'Secret~123456' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    test('POST /auth/login [с неправильным паролем] (Авторизация пользователя)', async () => {
      await request
        .post(`${apiPath}/auth/login`)
        .send({ ...loginRequestAdvertiser, password: 'sss' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    test('POST /auth/login [с неправильным email] (Авторизация пользователя)', async () => {
      await request
        .post(`${apiPath}/auth/login`)
        .send({ ...loginRequestAdvertiser, email: 'sss' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Авторизация пользователя [success]
     */
    test('POST /auth/login [success] (Авторизация пользователя)', async () => {
      const { body }: { body: AuthResponse } = await request
        .post(`${apiPath}/auth/login`)
        .send(loginRequestAdvertiser)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(body.payload?.type).toBe('bearer');
      expect(body.data?.id).toBe(userIdAdvertiser);
      expect(body.payload?.token).toBeDefined();
      expect(body.payload?.refreshToken).toBeDefined();
      expect((body.data as any).password).toBeUndefined();

      tokenAdvertiser = body.payload.token;
      refreshTokenAdvertiser = body.payload.refreshToken;
    });

    /**
     * WS авторизация пользователя
     */
    test("WebSocket 'auth/token' (Авторизация пользователя)", async () => {
      ws1 = new WebSocket(new URL('ws://localhost:8080/ws'));
      await new Promise((resolve) => ws1.on('open', resolve));

      ws1.send(
        JSON.stringify({
          event: 'auth/token',
          data: {
            token: tokenAdvertiser,
            date: new Date().toISOString(),
          },
        }),
      );
      const wsMessage = await new Promise<string>((resolve) => {
        ws1.on('message', (dataBuffer: Buffer) => {
          const data = dataBuffer.toString('utf8');
          resolve(data);
        });
      });

      expect(wsMessage).toBeDefined();
      const dataJson = JSON.parse(wsMessage);
      expect(dataJson).toBeDefined();
      const authorized = dataJson[0];
      const wallet = dataJson[1];
      const metrics = dataJson[2];
      expect(authorized).toBeDefined();
      expect(authorized.event).toBe(WsEvent.AUTH);
      expect(authorized.data).toBe('authorized');
      expect(wallet).toBeDefined();
      expect(wallet.event).toBe(WsEvent.WALLET);
      expect(wallet.data?.total).toBeDefined();
      expect(metrics).toBeDefined();
      expect(metrics.event).toBe(WsEvent.METRICS);
      expect(metrics.data).toBeDefined();
      ws1.close();
    });
  });

  /**
   *
   * Авторизация monitor-owner /auth
   *
   */
  describe('Авторизация monitor-owner /auth', () => {
    /**
     * Регистрация пользователя
     */
    test('POST /auth/register (Регистрация пользователя)', async () => {
      await request
        .post(`${apiPath}/auth/register`)
        .send(registerRequestMonitorOwner)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: UserGetResponse }) => {
          expect(body.data.id).toBeDefined();
          expect((body.data as any).password).toBeUndefined();
          userIdMonitorOwner = body.data.id;
        });
    });

    /**
     * Подтвердить email пользователя
     */
    test('POST /auth/email-verify (Подтвердить email пользователя)', async () => {
      userMonitorOwner = await userService.findById(userIdMonitorOwner);
      if (userMonitorOwner) {
        const verify: VerifyEmailRequest = {
          verify: generateMailToken(
            userMonitorOwner.email,
            userMonitorOwner.emailConfirmKey ?? '-',
          ),
        };

        await request
          .post(`${apiPath}/auth/email-verify`)
          .send(verify)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(({ body }: { body: SuccessResponse }) => {
            expect(body.status).toBe(Status.Success);
          });
      } else {
        expect(false).toEqual(true);
      }
    });

    /**
     * Авторизация пользователя [success]
     */
    test('POST /auth/login [success] (Авторизация пользователя)', async () => {
      const { body }: { body: AuthResponse } = await request
        .post(`${apiPath}/auth/login`)
        .send(loginRequestMonitorOwner)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(body.payload?.type).toBe('bearer');
      expect(body.data?.id).toBe(userIdMonitorOwner);
      expect(body.payload?.token).toBeDefined();
      expect(body.payload?.refreshToken).toBeDefined();
      expect((body.data as any).password).toBeUndefined();

      tokenMonitorOwner = body.payload.token;
      refreshTokenMonitorOwner = body.payload.refreshToken;
    });
  });

  /**
   * Авторизация
   */
  describe('Изменение advertiser-monitor', () => {
    /**
     * Изменение аккаунта пользователя
     */
    test('PATCH /auth (Изменение аккаунта пользователя)', async () => {
      const { body }: { body: UserGetResponse } = await request
        .patch(`${apiPath}/auth`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send(updateUser)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(body.status).toBe(Status.Success);
      expect(body.data.id).toBe(userIdAdvertiser);
      expect(body.data.surname).toBe(updateUser.surname);
      expect(body.data.name).toBe(updateUser.name);
      expect(body.data.middleName).toBe(updateUser.middleName);
      expect(body.data.phoneNumber).toBe(updateUser.phoneNumber);
      expect(body.data.city).toBe(updateUser.city);
      expect(body.data.country).toBe(updateUser.country);
      expect(body.data.locale).toBe(updateUser.locale);
      expect(body.data.preferredLanguage).toBe(updateUser.preferredLanguage);
      expect(body.data.company).toBe(updateUser.company);
      expect(body.data.companyLegalAddress).toBe(
        updateUser.companyLegalAddress,
      );
      expect(body.data.companyActualAddress).toBe(
        updateUser.companyActualAddress,
      );
      expect(body.data.companyTIN).toBe(updateUser.companyTIN);
      expect(body.data.companyRRC).toBe(updateUser.companyRRC);
      expect(body.data.companyPSRN).toBe(updateUser.companyPSRN);
      expect(body.data.companyPhone).toBe(updateUser.companyPhone);
      expect(body.data.companyEmail).toBe(updateUser.companyEmail);
      expect(body.data.companyBank).toBe(updateUser.companyBank);
      expect(body.data.companyBIC).toBe(updateUser.companyBIC);
      expect(body.data.companyCorrespondentAccount).toBe(
        updateUser.companyCorrespondentAccount,
      );
      expect(body.data.companyPaymentAccount).toBe(
        updateUser.companyPaymentAccount,
      );
      expect(body.data.companyFax).toBe(updateUser.companyFax);
      expect(body.data.companyRepresentative).toBe(
        updateUser.companyRepresentative,
      );
      expect(body.data.company).toBe(updateUser.company);
      expect(body.data.password).toBeUndefined();
    });

    /**
     * Изменение аккаунта пользователя (с паролем - неудача)
     */
    test('PATCH /auth (Изменение аккаунта пользователя: неудача)', async () => {
      await request
        .patch(`${apiPath}/auth`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send({ ...updateUser, password: 'Gruodis19771203!' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Проверяет, авторизован ли пользователь и выдает о пользователе полную информацию
     */
    test('GET /auth (Проверяет, авторизован ли пользователь и выдает о пользователе полную информацию)', async () => {
      await request
        .get(`${apiPath}/auth`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: UserGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.id).toBe(userIdAdvertiser);
          expect(body.data.password).toBeUndefined();
          expect(body.data.surname).toBe(updateUser.surname);
          expect(body.data.name).toBe(updateUser.name);
          expect(body.data.middleName).toBe(updateUser.middleName);
          expect(body.data.phoneNumber).toBe(updateUser.phoneNumber);
          expect(body.data.city).toBe(updateUser.city);
          expect(body.data.country).toBe(updateUser.country);
          expect(body.data.locale).toBe(updateUser.locale);
          expect(body.data.preferredLanguage).toBe(
            updateUser.preferredLanguage,
          );
          expect(body.data.company).toBe(updateUser.company);
          expect(body.data.companyLegalAddress).toBe(
            updateUser.companyLegalAddress,
          );
          expect(body.data.companyActualAddress).toBe(
            updateUser.companyActualAddress,
          );
          expect(body.data.companyTIN).toBe(updateUser.companyTIN);
          expect(body.data.companyRRC).toBe(updateUser.companyRRC);
          expect(body.data.companyPSRN).toBe(updateUser.companyPSRN);
          expect(body.data.companyPhone).toBe(updateUser.companyPhone);
          expect(body.data.companyEmail).toBe(updateUser.companyEmail);
          expect(body.data.companyBank).toBe(updateUser.companyBank);
          expect(body.data.companyBIC).toBe(updateUser.companyBIC);
          expect(body.data.companyCorrespondentAccount).toBe(
            updateUser.companyCorrespondentAccount,
          );
          expect(body.data.companyPaymentAccount).toBe(
            updateUser.companyPaymentAccount,
          );
          expect(body.data.companyFax).toBe(updateUser.companyFax);
          expect(body.data.companyRepresentative).toBe(
            updateUser.companyRepresentative,
          );
          expect(body.data.company).toBe(updateUser.company);
          expect(body.data.password).toBeUndefined();
        });
    });

    /**
     * Обновление токена [неправильный refresh_token]
     */
    test('POST /auth/refresh [неправильный refresh_token] (Обновление токена)', async () => {
      const verify: VerifyEmailRequest = { verify: 'фывфвафавыаы' };
      await request
        .post(`${apiPath}/auth/refresh`)
        .send(verify)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Обновление токена [отсутствие refresh_token]
     */
    test('POST /auth/refresh [отсутствие refresh_token] (Обновление токена)', async () => {
      await request
        .post(`${apiPath}/auth/refresh`)
        .send({})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    test('POST /auth/refresh [success] (Обновление токена)', async () => {
      const verify: AuthRefreshRequest = {
        refreshToken: refreshTokenAdvertiser ?? '',
      };
      const content = request.post(`${apiPath}/auth/refresh`).send(verify);

      await content
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: AuthRefreshResponse }) => {
          expect(body.payload.token).toBeDefined();
          tokenAdvertiser = body.payload.token ?? undefined;
          refreshTokenAdvertiser = body.payload.refreshToken;
        });
    });

    /**
     * Отправить на почту пользователю разрешение на смену пароля [отсутствие email]
     */
    test('POST /auth/reset-password [отсутствие email] (Отправить на почту пользователю разрешение на смену пароля)', async () => {
      const body = request.post(`${apiPath}/auth/reset-password`).send({});

      await body
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Отправить на почту пользователю разрешение на смену пароля [succcess]
     */
    test('POST /auth/reset-password [success] (Отправить на почту пользователю разрешение на смену пароля)', async () => {
      const verify: ResetPasswordInvitationRequest = {
        email: userAdvertiser?.email ?? '',
      };

      await request
        .post(`${apiPath}/auth/reset-password`)
        .send(verify)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: SuccessResponse }) => {
          expect(body.status).toBe(Status.Success);
        });
    });

    // TODO: POST /auth/reset-password-verify - Меняет пароль пользователя по приглашению из почты

    /**
     * Скрытие аккаунта пользователя - неавторизован
     */
    test('PATCH /auth/disable [неавторизован] (Скрытие аккаунта пользователя)', async () => {
      await request
        .patch(`${apiPath}/auth/disable`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    /**
     * Скрытие аккаунта пользователя
     */
    test('PATCH /auth/disable [success] (Скрытие аккаунта пользователя)', async () => {
      await request
        .patch(`${apiPath}/auth/disable`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: SuccessResponse }) => {
          expect(body.status).toBe(Status.Success);
        });
    });

    /**
     * Изменение через базу disabled: false
     */
    test('Change user Disabled: False (database access)', async () => {
      if (userAdvertiser) {
        const userUpdate = await userService.update(userAdvertiser, {
          disabled: false,
        });
        expect(userUpdate).toBeDefined();
        expect(userUpdate?.id).toBe(userIdAdvertiser);
      } else {
        expect(false).toEqual(true);
      }
    });
  });

  /**
   * Константы
   */
  describe('Константы /constants', () => {
    /**
     * Константы
     */
    test('GET /constants (Константы)', async () => {
      await request
        .get(`${apiPath}/constants`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: ConstantsGetResponse }) => {
          expect(body.data.COMMISSION_PERCENT).toBeGreaterThanOrEqual(0);
          expect(body.data.MIN_INVOICE_SUM).toBeGreaterThanOrEqual(0);
          expect(body.data.SUBSCRIPTION_FEE).toBeGreaterThanOrEqual(0);
          expect(body.data.VERSION_BACKEND).toBeDefined();
        });
    });
  });

  /**
   *
   * Папки (/folder)
   *
   */
  describe('Папки /folder', () => {
    /**
     * Получение списка папок [ scope: { limit: 0 } ]
     */
    test('POST /folder [ scope: { limit: 0 } }] (Получение списка папок)', async () => {
      await request
        .post(`${apiPath}/folder`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send({ where: {}, scope: { limit: 0 } })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Создание новой папки
     */
    test('PUT /folder [name: "bar"] (Создание новой папки)', async () => {
      await request
        .put(`${apiPath}/folder`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send({ name: 'bar' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: FolderGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.name).toBe('bar');
          expect((body.data as any)?.user?.password).toBeUndefined();
          parentFolderId = body.data.id;
        });
    });

    test('PUT /folder [name: "baz"] (Создание новой папки)', async () => {
      await request
        .put(`${apiPath}/folder`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send({ name: 'baz' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: FolderGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.name).toBe('baz');
          expect((body.data as any)?.user?.password).toBeUndefined();
          parentFolderId2 = body.data.id;
          folderId3 = body.data.id;
        });
    });

    /**
     * Создание новой под-папки
     */
    test('PUT /folder [name: "foo", parentFolderId] (Создание новой под-папки)', async () => {
      await request
        .put(`${apiPath}/folder`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send({ name: 'foo', parentFolderId })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: FolderGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.name).toBe('foo');
          expect(body.data.parentFolderId).toBe(parentFolderId);
          expect((body.data as any)?.user?.password).toBeUndefined();
          folderId1 = body.data.id;
        });
    });

    /**
     * Создание новой под-папки
     */
    test('PUT /folder [name: "baz", parentFolderId] (Создание новой под-папки)', async () => {
      await request
        .put(`${apiPath}/folder`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send({ name: 'baz', parentFolderId: parentFolderId2 })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: FolderGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.name).toBe('baz');
          expect(body.data.parentFolderId).toBe(parentFolderId2);
          expect((body.data as any)?.user?.password).toBeUndefined();
          folderId2 = body.data.id;
        });
    });

    /**
     * Получение списка папок [{ where: { id: '' }, scope: { limit: 0 } }]
     */
    test("POST /folder [{ where: { id: '' }, scope: { limit: 0 } }] (Получение списка папок)", async () => {
      if (!tokenAdvertiser) {
        expect(false).toEqual(true);
      }

      await request
        .post(`${apiPath}/folder`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send({
          where: { id: '' },
          scope: { limit: 0 },
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Получение списка папок
     */
    test('POST /folder [success] (Получение списка папок)', async () => {
      if (!tokenAdvertiser) {
        expect(false).toEqual(true);
      }

      const content = request
        .post(`${apiPath}/folder`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send({ where: {}, scope: {} })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      await content.then(({ body }: { body: FoldersGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeDefined();
        expect((body.data as any)?.[0]?.userId).toBeDefined();
        expect((body.data as any)?.[0]?.user?.password).toBeUndefined();
      });
    });

    /**
     * Изменение информации о папке
     */
    test('PATCH /folder/{folderId} [success] (Изменение информации о папке)', async () => {
      if (!tokenAdvertiser || !folderId2) {
        expect(false).toEqual(true);
      }

      const { body }: { body: FolderGetResponse } = await request
        .patch(`${apiPath}/folder/${folderId2}`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send({
          name: 'bar2',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(body.status).toBe(Status.Success);
      expect(body.data).toBeDefined();
      expect(body.data.id).toBe(folderId2);
      expect(body.data.name).toBe('bar2');
      expect((body.data as any)?.user?.password).toBeUndefined();
    });

    /**
     * Изменение информации о папке [неуспешно]
     */
    test('PATCH /folder/{folderId} [unsuccess] (Изменение информации о папке)', async () => {
      if (!tokenAdvertiser || !folderId2) {
        expect(false).toEqual(true);
      }

      await request
        .patch(`${apiPath}/folder/${folderId2}`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send({
          name: 'bar2',
          parentFolderId: '111',
        })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Получение информации о папке [успешно]
     */
    test('GET /folder/{folderId} [success] (Получение информации о папке)', async () => {
      if (!tokenAdvertiser || !folderId2) {
        expect(false).toEqual(true);
      }

      await request
        .get(`${apiPath}/folder/${folderId2}`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: FolderGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data.id).toBe(folderId2);
          expect(body.data.name).toBe('bar2');
          expect((body.data as any)?.user?.password).toBeUndefined();
        });
    });

    /**
     * Удаление папки [успешно]
     */
    test('DELETE /folder/{folderId} [success] (Удаление папки)', async () => {
      if (!tokenAdvertiser || !folderId2) {
        expect(false).toEqual(true);
      }

      await request
        .delete(`${apiPath}/folder/${folderId2}`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: SuccessResponse }) => {
          expect(body.status).toBe(Status.Success);
        });
    });
  });

  /**
   *
   * Файлы
   *
   */
  describe('Файлы /file', () => {
    /**
     * Получение списка файлов (неуспешно)
     */
    test('POST /file [unsuccess] (Получение списка файлов)', async () => {
      if (!tokenAdvertiser) {
        expect(false).toEqual(true);
      }

      await request
        .post(`${apiPath}/file`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send({
          where: { folderId: '111' },
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Получение списка файлов
     */
    test('POST /file (Получение списка файлов)', async () => {
      if (!tokenAdvertiser || !folderId1) {
        expect(false).toEqual(true);
      }

      const files: FilesGetRequest = {
        where: { folderId: folderId1 },
        scope: {},
      };

      await request
        .post(`${apiPath}/file`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send(files)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: FilesGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data[0]?.user?.password).toBeUndefined();
        });
    });

    /**
     * Загрузка файлов [success]
     */
    test('PUT /file [success] (Загрузка файлов)', async () => {
      if (!tokenAdvertiser || !folderId1) {
        expect(false).toEqual(true);
      }

      const field = {
        param: `{ "folderId": "${folderId1}", "category": "media" }`,
      };
      const files = `${__dirname}/testing.png`;

      const { body }: { body: FilesUploadResponse } = await request
        .put(`${apiPath}/file`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .set('Accept', 'application/json')
        .field(field)
        .attach('files', files)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(body.status).toBe(Status.Success);
      expect(body.data).toBeDefined();
      expect(body.data[0].id).toBeDefined();
      mediaId1 = body.data[0].id;
      expect(body.data[0]?.user?.password).toBeUndefined();
    });

    /**
     * Скачивание медиа [success]
     */
    test('GET /file/download/{mediaId} [success] (Скачивание медиа)', async () => {
      if (!tokenAdvertiser || !mediaId1) {
        expect(false).toEqual(true);
      }

      const { body }: { body: unknown } = await request
        .get(`${apiPath}/file/download/${mediaId1}`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect(200);

      expect(body).toBeDefined();
    });

    /**
     * Скачивание предпросмотра [success]
     */
    test('GET /file/preview/{mediaId} [success] (Скачивание предпросмотра)', async () => {
      if (!tokenAdvertiser || !mediaId1) {
        expect(false).toEqual(true);
      }

      const { body }: { body: unknown } = await request
        .get(`${apiPath}/file/preview/${mediaId1}`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect(200);

      expect(body).toBeDefined();
    });

    /**
     * Удаление файлов [success]
     */
    test('DELETE /file/{mediaId} [success] (Удаление файлов)', async () => {
      if (!tokenAdvertiser || !mediaId1) {
        expect(false).toEqual(true);
      }

      const { body }: { body: SuccessResponse } = await request
        .delete(`${apiPath}/file/${mediaId1}`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(body.status).toBe(Status.Success);
    });
  });

  /**
   *
   * Мониторы
   *
   */
  describe('Мониторы /monitor', () => {
    /**
     * Получение списка мониторов (неуспешно)
     */
    test('POST /monitor [unsuccess] (Получение списка мониторов)', async () => {
      if (!tokenAdvertiser) {
        expect(false).toEqual(true);
      }

      const monitors: MonitorsGetRequest = {
        where: {},
        scope: { limit: 0 },
      };

      await request
        .post(`${apiPath}/monitor`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send(monitors)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Получение списка мониторов
     */
    test('POST /monitor (Получение списка мониторов)', async () => {
      if (!tokenAdvertiser) {
        expect(false).toEqual(true);
      }

      const monitors: MonitorsGetRequest = {
        where: {
          name: '%',
          status: MonitorStatus.Offline,
          price1s: [0, 10000],
          minWarranty: [0, 10000],
          maxDuration: [0, 10000],
          dateWhenApp: [
            new Date('2000-01-01T00:00:00'),
            new Date('2030-01-01T00:00:00'),
          ],
        },
        scope: {},
      };

      await request
        .post(`${apiPath}/monitor`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send(monitors)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: MonitorsGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data[0]?.user?.password).toBeUndefined();
        });
    });

    /**
     * Регистрация монитора
     */
    test('PUT /monitor (Регистрация монитора)', async () => {
      if (!tokenMonitorOwner) {
        expect(false).toEqual(true);
      }
      monitorName1 = '% test monitor % ' + jabber.createWord(5);
      monitorCode1 = generateCode();

      const monitor: MonitorCreateRequest = {
        name: monitorName1,
        code: monitorCode1,
        price1s: 1,
        minWarranty: 10,
        maxDuration: 10000,
        width: 1920,
        height: 1080,
        address: {},
        category: MonitorCategoryEnum.ATM,
        orientation: MonitorOrientation.Horizontal,
        multiple: MonitorMultiple.SINGLE,
        sound: true,
        angle: 0,
        brightness: 0,
      };

      await request
        .put(`${apiPath}/monitor`)
        .auth(tokenMonitorOwner, { type: 'bearer' })
        .send(monitor)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: MonitorsGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data[0]?.user?.password).toBeUndefined();
        });
    });

    /**
     * Регистрация монитора (немного измененные параметры)
     */
    test('PUT /monitor (Регистрация монитора немного измененные параметры)', async () => {
      if (!tokenMonitorOwner) {
        expect(false).toEqual(true);
      }

      const monitor = {
        name: '% test monitor % ' + jabber.createWord(5),
        code: generateCode(),
        price1s: '1.00005',
        minWarranty: 10,
        maxDuration: 10000,
        width: 1920,
        height: 1080,
        address: {},
        category: MonitorCategoryEnum.ATM,
        orientation: MonitorOrientation.Horizontal,
        multiple: MonitorMultiple.SINGLE,
        sound: true,
        angle: 0,
        brightness: 0,
      };

      await request
        .put(`${apiPath}/monitor`)
        .auth(tokenMonitorOwner, { type: 'bearer' })
        .send(monitor)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: MonitorsGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data[0]?.user?.password).toBeUndefined();
        });
    });
  });

  /**
   *
   * Заявки
   *
   */
  describe('Заявки /bid', () => {
    /**
     * Получение списка заявок (неуспешно)
     */
    test('POST /bid [unsuccess] (Получение списка заявок)', async () => {
      if (!tokenAdvertiser) {
        expect(false).toEqual(true);
      }

      const bids: BidsGetRequest = {
        where: {},
        scope: { limit: 0 },
      };

      await request
        .post(`${apiPath}/bid`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send(bids)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Получение списка заявок
     */
    test('POST /bid (Получение списка заявок)', async () => {
      if (!tokenAdvertiser) {
        expect(false).toEqual(true);
      }

      const bids: BidsGetRequest = {
        where: {
          status: BidStatus.OK,
        },
      };

      await request
        .post(`${apiPath}/bid`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send(bids)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: BidsGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data[0]?.user?.password).toBeUndefined();
        });
    });
  });

  /**
   *
   * Счета
   *
   */
  describe('Счета /invoice', () => {
    /**
     * Получение списка счетов (неуспешно)
     */
    test('POST /invoice [unsuccess] (Получение списка счетов)', async () => {
      if (!tokenAdvertiser) {
        expect(false).toEqual(true);
      }

      const invoices: InvoicesGetRequest = {
        where: {},
        scope: { limit: 0 },
      };

      await request
        .post(`${apiPath}/invoice`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send(invoices)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Получение списка счетов
     */
    test('POST /invoice (Получение списка счетов)', async () => {
      if (!tokenAdvertiser) {
        expect(false).toEqual(true);
      }

      const invoices: InvoicesGetRequest = {
        where: { sum: [100, 10000] },
        scope: {},
      };

      await request
        .post(`${apiPath}/invoice`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send(invoices)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: InvoicesGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data[0]?.user?.password).toBeUndefined();
        });
    });

    /**
     * Выставление счета
     */
    test('PUT /invoice (Выставление счета)', async () => {
      if (!tokenAdvertiser) {
        expect(false).toEqual(true);
      }

      const invoice: InvoiceCreateRequest = {
        sum: 1000,
        description: 'тестовый запуск',
      };

      await request
        .put(`${apiPath}/invoice`)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .send(invoice)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: InvoiceGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data?.user?.password).toBeUndefined();
          invoiceId = body.data.id;
        });
    });

    // /**
    //  * Скачивание счета
    //  */
    // test('GET /invoice/download/:invoiceId/:format (Скачивание счета)', async () => {
    //   if (!tokenAdvertiser) {
    //     expect(false).toEqual(true);
    //   }
    //   if (!invoiceId) {
    //     expect(false).toEqual(true);
    //   }

    //   await request
    //     .get(`${apiPath}/invoice/download/${invoiceId}/xlsx`)
    //     .auth(tokenAdvertiser, { type: 'bearer' })
    //     .set('Accept', 'application/json')
    //     .expect('Content-Type', /application\/vnd.ms-excel/)
    //     .expect(200);
    // });
  });

  /**
   *
   * Повышаем роли до администратора и проверяем /user, и после этого удаляем
   *
   */
  describe('Повышаем роли до администратора и проверяем /user, и после этого удаляем', () => {
    /**
     * Administrator
     */
    test('Change user Role: Administrator (database access)', async () => {
      if (userAdvertiser) {
        const userUpdate = await userService.update(userAdvertiser, {
          role: UserRoleEnum.Administrator,
        });
        expect(userUpdate).toBeDefined();
        if (!userUpdate) {
          return;
        }
        expect(userUpdate.id).toBe(userIdAdvertiser);
        expect(userUpdate.role).toBe(UserRoleEnum.Administrator);
      } else {
        expect(false).toEqual(true);
      }
    });

    // TODO: GET /user - Получение информации о пользователях (только администратор)
    // TODO: GET /user/{userId} - Получение информации о пользователе (только администратор)
    // TODO: POST /user/{userId} - Изменение информации о пользователе (только администратор)
    // TODO: DELETE /user/disable/{userId} - Скрытие аккаунта пользователя (только администратор)
    // TODO: POST /user/enable/{userId} - Открытие аккаунта пользователя (только администратор)

    test('POST /auth/login [success] (Повторная авторизация пользователя)', async () => {
      await request
        .post(`${apiPath}/auth/login`)
        .send(loginRequestAdvertiser)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: AuthResponse }) => {
          expect(body.payload?.type).toBe('bearer');
          expect(body.data?.id).toBe(userIdAdvertiser);
          expect(body.payload?.token).toBeDefined();
          expect(body.payload?.refreshToken).toBeDefined();
          expect((body.data as any).password).toBeUndefined();
          tokenAdvertiser = body.payload?.token ?? '';
          refreshTokenAdvertiser = body.payload?.refreshToken ?? '';
        });
    });

    /**
     * Удаление аккаунта пользователя monitor-owner (только администратор)
     */
    test('/user/{userIdMonitorOwner} (Удаление аккаунта пользователя monitor-owner, только администратор)', async () => {
      if (!tokenMonitorOwner || !userIdMonitorOwner) {
        expect(false).toBe(true);
      }

      const url = `${apiPath}/user/${userIdMonitorOwner}`;
      await request
        .delete(url)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ status: Status.Success });
    });

    /**
     * Удаление аккаунта пользователя advertiser (только администратор)
     */
    test('/user/{userIdAdvertiser} (Удаление аккаунта пользователя advertiser, только администратор)', async () => {
      if (!tokenAdvertiser || !userIdAdvertiser) {
        expect(false).toBe(true);
      }

      const url = `${apiPath}/user/${userIdAdvertiser}`;
      await request
        .delete(url)
        .auth(tokenAdvertiser, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ status: Status.Success });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
