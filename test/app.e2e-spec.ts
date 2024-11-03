/* eslint max-len:0 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import superAgent from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpAdapterHost } from '@nestjs/core';
import { INestApplication, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Jabber from 'jabber';
import WebSocket from 'ws';
import { Logger } from 'nestjs-pino';
import { I18nValidationPipe } from 'nestjs-i18n';
import dayjs from 'dayjs';
import { Observable, of } from 'rxjs';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock } from '@golevelup/ts-jest';

import { WsAuthObject, WsMetricsObject, WsWalletObject } from '@/interfaces';
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
  WalletOperationsGetResponse,
  WalletOperationsGetRequest,
  PlaylistCreateRequest,
  PlaylistGetResponse,
  MonitorGetResponse,
  EditorCreateRequest,
  EditorGetResponse,
  EditorLayerCreateRequest,
  EditorLayerGetResponse,
  EditorExportRequest,
  EditorGetRenderingStatusResponse,
  MonitorsPlaylistAttachRequest,
  FoldersCopyRequest,
  BidUpdateRequest,
  BidGetResponse,
  AuthMonitorRequest,
  EditorsGetResponse,
  EditorResponse,
} from '@/dto';
import {
  BidApprove,
  BidStatus,
  InvoiceStatus,
  MonitorCategoryEnum,
  MonitorMultiple,
  MonitorOrientation,
  MonitorStatus,
  RenderingStatus,
  Status,
  UserPlanEnum,
  UserRoleEnum,
  WalletTransactionType,
  WsEvent,
} from '@/enums';
import { generateMailToken } from '@/utils/mail-token';
import { ExceptionsFilter } from '@/exception/exceptions.filter';
import { UserEntity } from '@/database/user.entity';
import { UserService } from '@/database/user.service';
import { AppModule } from '@/app.module';
import { WsAdapter } from '@/websocket/ws-adapter';
import { UserExtView } from '@/database/user-ext.view';
import { HttpError } from '@/errors';
import { MsvcModule } from '@/microservice/microservice.module';

type UserFileEntity = UserEntity & Partial<UserExtView>;

@Module({
  providers: [
    {
      provide: AmqpConnection,
      useValue: createMock<AmqpConnection>(),
    },
  ],
  exports: [AmqpConnection],
})
class MockMsvcModule {}

const fileXLS = `${__dirname}/testing.xlsx`;
const fileXLSfilesize = fs.statSync(fileXLS).size;
// const fileXLSbuffer = fs.readFileSync(fileXLS);
const imageTestingDirname = `${__dirname}/testing.png`;
const imageTestingFilesize = fs.statSync(imageTestingDirname).size;
const imageTestingBuffer = fs.readFileSync(imageTestingDirname);
// const imageTestingBinary = imageTestingBuffer.toString('binary');
const videoTestingDirname = `${__dirname}/testing.mp4`;
// const videoTestingBuffer = fs.readFileSync(videoTestingDirname);
const videoTestingFilesize = fs.statSync(videoTestingDirname).size;

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
const passwordAdvertiser = generatePassword(30);
const emailMonitorOwner = jabber.createEmail();
const passwordMonitorOwner = generatePassword(30);
const emailAccountant = jabber.createEmail();
const passwordAccountant = generatePassword(30);

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve({}),
  findAndCount: async () => Promise.resolve([{}]),
  save: async () => Promise.resolve({}),
  create: () => '',
  remove: async () => Promise.resolve([]),
  get: () => '',
  send: (): Observable<Buffer> => {
    return of(Buffer.from('test'));
  },
  emit: (): Observable<Buffer> => {
    return of(Buffer.from('test'));
  },
  metadata: {
    columns: [],
    relations: [],
  },
}));

const registerRequestAdvertiser: RegisterRequest = {
  email: emailAdvertiser,
  password: passwordAdvertiser,
  role: UserRoleEnum.Advertiser,
  name: 'Advertiser',
  surname: 'Advertiser',
  middleName: 'Advertiser',
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
  name: 'MonitorOwner',
  surname: 'MonitorOwner',
  middleName: 'MonitorOwner',
  preferredLanguage: 'ru',
  city: 'Krasnodar',
  country: 'RU',
  company: 'ACME corporation',
  phoneNumber: '+78002000000',
};

const registerRequestAccountant: RegisterRequest = {
  email: emailAccountant,
  password: passwordAccountant,
  role: UserRoleEnum.MonitorOwner,
  name: 'Accountant',
  surname: 'Accountant',
  middleName: 'Accountant',
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

const loginRequestAccountant: LoginRequest = {
  email: emailAccountant,
  password: passwordAccountant,
};

const updateUser: UserUpdateRequest = {
  surname: 'Owner',
  name: 'Monitor',
  middleName: 'the best monitor-owner !',
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

const monitorOwnerInvoiceSum = 1000;
const advertiserInvoiceSum = 5000000000;

let app: INestApplication;
let wsAdvertiser: WebSocket;
let wsMonitorOwner: WebSocket;
let wsMonitorSingle: WebSocket;
let wsMonitorMirror1: WebSocket;
let wsMonitorMirror2: WebSocket;

let configService: ConfigService;
let port: number;
let wsUrl: string;
let userService: UserService;
let request: TestAgent;
let apiPath = '/api/v2';
let logger: Logger;

let advertiserUser: UserFileEntity | null;
let monitorOwnerUser: UserFileEntity | null;
let accountantUser: UserFileEntity | null;

let advertiserToken: string;
let advertiserRefreshToken: string | undefined;

let monitorOwnerToken: string;
let monitorOwnerRefreshToken: string | undefined;

let accountantToken: string;
let accountantRefreshToken: string | undefined;

let advertiserUserId: string;
let monitorOwnerUserId: string;
let accountantUserId: string;

const monitorNameMirror1 = 'Test monitor: ' + jabber.createWord(5);
const monitorCodeMirror1 = generateCode();
let monitorMirror1Id: string;

const monitorNameMirror2 = 'Test monitor: ' + jabber.createWord(5);
const monitorCodeMirror2 = generateCode();
let monitorMirror2Id: string;

const monitorNameSingle = 'Test single: ' + jabber.createWord(5);
const monitorCodeSingle = generateCode();
let monitorSingleToken: string;
let monitorSingleRefreshToken: string;
let monitorSingleId: string;

const monitorNameGroupMirror = 'Test mirror monitor: ' + jabber.createWord(5);
const monitorCodeGroupMirror = generateCode();
let monitorGroupMirrorId: string;

const monitorNameScaling1 = 'Test monitor: ' + jabber.createWord(5);
const monitorCodeScaling1 = generateCode();
let monitorScaling1Id: string;

const monitorNameScaling2 = 'Test monitor: ' + jabber.createWord(5);
const monitorCodeScaling2 = generateCode();
let monitorScaling2Id: string;

const monitorNameScaling3 = 'Test monitor: ' + jabber.createWord(5);
const monitorCodeScaling3 = generateCode();
let monitorScaling3Id: string;

const monitorNameScaling4 = 'Test monitor: ' + jabber.createWord(5);
const monitorCodeScaling4 = generateCode();
let monitorScaling4Id: string;

const monitorNameGroupScaling = 'Test scaling monitor: ' + jabber.createWord(5);
const monitorCodeGroupScaling = generateCode();
let monitorGroupScalingId: string;

const MONITOR_OWNER_MONITOR_COUNT_USER = 7;
const MONITOR_OWNER_MONITOR_COUNT_OFFLINE = 7;
const MONITOR_OWNER_MONITOR_COUNT_ONLINE = 0;
const MONITOR_OWNER_MONITOR_COUNT_EMPTY = 7;

let monitorOwnerRootFolderId: string | null;
let monitorOwnerFolderBarId: string;
let monitorOwnerFolderBazId: string;
let monitorOwnerFolderFooId: string;

let monitorOwnerImageId: string;
let monitorOwnerImageId1: string;
let advertiserVideoId: string;

let advertiserPlaylistId1: string;
let advertiserEditorId: string;
let advertiserEditorLayerId: string;
let advertiserEditorAutoId: EditorResponse[];

let monitorOwnerInvoiceId: string;
let monitorOwnerInvoiceId2: string;
const monitorOwnerInvoiceFilesize2 = 0;
let advertiserInvoiceId: string;

let advertiserBidMonitorSingleId: string;
let advertiserBidMonitorMirrorId: string;
let advertiserBidMonitorScalingId: string;

/**
 *
 *
 *
 * Бизнес-логика. Пользовательский путь.
 *
 *
 *
 */
describe('Пользовательский путь: MonitorOwner, Advertiser, Accountant', () => {
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(MsvcModule)
      .useModule(MockMsvcModule)
      .compile();
    app = moduleFixture.createNestApplication();

    const httpAdaper = app.get(HttpAdapterHost);
    configService = app.get(ConfigService);

    const logLevel = configService.getOrThrow('LOG_LEVEL');
    if (logLevel === 'debug') {
      logger = app.get(Logger);
      app.useLogger(logger);
    }

    apiPath = configService.getOrThrow('API_PATH', '/api/v2');
    app.setGlobalPrefix(apiPath, { exclude: ['/'] });
    app.useGlobalFilters(
      new ExceptionsFilter(httpAdaper.httpAdapter, configService),
    );
    app.useGlobalPipes(
      new I18nValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        skipUndefinedProperties: true,
      }),
    );
    app.useWebSocketAdapter(new WsAdapter(app));
    userService = app.get<UserService>(UserService);
    port = parseInt(configService.getOrThrow('PORT'), 10);
    await app.listen(port);

    request = superAgent(app.getHttpServer());
    wsUrl = `ws://localhost:${port}/ws`;
  });

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

  /**
   * MonitorOwner: Регистрация пользователя
   */
  test('MonitorOwner: POST /auth/register', async () => {
    await request
      .post(`${apiPath}/auth/register`)
      .send(registerRequestMonitorOwner)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)
      .then(({ body }: { body: UserGetResponse }) => {
        expect(body.data.id).toBeTruthy();
        expect((body.data as any).password).toBeUndefined();
        monitorOwnerUserId = body.data.id;
      });
  });
  /**
   * MonitorOwner: Подтвердить email пользователя
   */
  test('MonitorOwner: POST /auth/email-verify', async () => {
    monitorOwnerUser = await userService.findById(monitorOwnerUserId, {
      select: ['id', 'email', 'emailConfirmKey'],
    });
    if (monitorOwnerUser) {
      const verify: VerifyEmailRequest = {
        verify: generateMailToken(
          monitorOwnerUser.email,
          monitorOwnerUser.emailConfirmKey ?? '<undefined>',
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

      monitorOwnerUser = await userService.findById(monitorOwnerUserId);
    } else {
      expect(false).toEqual(true);
      return;
    }
  });
  /**
   * MonitorOwner: Авторизация пользователя
   */
  test('MonitorOwner: POST /auth/login', async () => {
    const { body }: { body: AuthResponse } = await request
      .post(`${apiPath}/auth/login`)
      .send(loginRequestMonitorOwner)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(body.payload.type).toBe('bearer');
    expect(body.data.id).toBe(monitorOwnerUserId);
    expect(body.data.role).toBe(UserRoleEnum.MonitorOwner);
    expect(body.data.planValidityPeriod).toBe(13);
    expect(body.data.surname).toBe(registerRequestMonitorOwner.surname);
    expect(body.data.name).toBe(registerRequestMonitorOwner.name);
    expect(body.data.middleName).toBe(registerRequestMonitorOwner.middleName);
    expect(body.data.plan).toBe(UserPlanEnum.Demo);
    expect(body.payload?.token).toBeDefined();
    expect(body.payload?.refreshToken).toBeDefined();
    expect((body.data as any).password).toBeUndefined();

    monitorOwnerToken = body.payload.token;
    monitorOwnerRefreshToken = body.payload.refreshToken;
  });

  /**
   * Advertiser: Регистрация пользователя
   */
  test('Advertiser: POST /auth/register', async () => {
    await request
      .post(`${apiPath}/auth/register`)
      .send(registerRequestAdvertiser)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)
      .then(({ body }: { body: UserGetResponse }) => {
        expect(body.data.id).toBeTruthy();
        expect((body.data as any).password).toBeUndefined();
        advertiserUserId = body.data.id;
        // попадает в демо-режим ?
      });
  });

  test('Advertiser: POST /auth/login [email пока не подтвержден]', async () => {
    await request
      .post(`${apiPath}/auth/login`)
      .send(loginRequestAdvertiser)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403);
  });

  /**
   * Advertiser: Регистрация пользователя опять с теми же самыми параметрами
   */
  test('Advertiser: POST /auth/register [опять, с теми же самыми параметрами]', async () => {
    await request
      .post(`${apiPath}/auth/register`)
      .send(registerRequestAdvertiser)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(412);
  });

  /**
   * Advertiser: Регистрация пользователя опять
   */
  test('Advertiser: POST /auth/register [email пуст, пароль пуст]', async () => {
    await request
      .post(`${apiPath}/auth/register`)
      .send({ ...registerRequestAdvertiser, email: '', password: '' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  /**
   * Advertiser: Подтвердить email пользователя
   */
  test('Advertiser: POST /auth/email-verify', async () => {
    advertiserUser = await userService.findById(advertiserUserId, {
      select: ['id', 'email', 'emailConfirmKey'],
    });
    if (advertiserUser) {
      const verify: VerifyEmailRequest = {
        verify: generateMailToken(
          advertiserUser.email,
          advertiserUser.emailConfirmKey ?? '<undefined>',
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
          expect((body as any)?.data).toBeUndefined();
        });

      advertiserUser = await userService.findById(advertiserUserId);
    } else {
      expect(false).toEqual(true);
      return;
    }
  });

  /**
   * Авторизация пользователя с пустым паролем
   */
  test('POST /auth/login [с пустым паролем]', async () => {
    await request
      .post(`${apiPath}/auth/login`)
      .send({ email: 'foo@bar.baz' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  test('POST /auth/login [с пустым email]', async () => {
    await request
      .post(`${apiPath}/auth/login`)
      .send({ password: 'Secret~123456' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  test('POST /auth/login [с неправильным паролем]', async () => {
    await request
      .post(`${apiPath}/auth/login`)
      .send({ ...loginRequestAdvertiser, password: 'sss' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  test('POST /auth/login [с неправильным email]', async () => {
    await request
      .post(`${apiPath}/auth/login`)
      .send({ ...loginRequestAdvertiser, email: 'sss' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  /**
   * Advertiser: Авторизация пользователя
   */
  test('Advertiser: POST /auth/login', async () => {
    const { body }: { body: AuthResponse } = await request
      .post(`${apiPath}/auth/login`)
      .send(loginRequestAdvertiser)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(body.payload?.type).toBe('bearer');
    expect(body.data?.id).toBe(advertiserUserId);
    expect(body.data.role).toBe(UserRoleEnum.Advertiser);
    expect(body.data.planValidityPeriod).toBe(0);
    expect(body.data.surname).toBe(registerRequestAdvertiser.surname);
    expect(body.data.name).toBe(registerRequestAdvertiser.name);
    expect(body.data.middleName).toBe(registerRequestAdvertiser.middleName);
    expect(body.data.plan).toBe(UserPlanEnum.Full);
    expect(body.payload?.token).toBeDefined();
    expect(body.payload?.refreshToken).toBeDefined();
    expect((body.data as any).password).toBeUndefined();

    advertiserToken = body.payload.token;
    advertiserRefreshToken = body.payload.refreshToken;
  });

  /**
   * Advertiser: Изменение аккаунта пользователя
   */
  test('Advertiser: PATCH /auth', async () => {
    const { body }: { body: UserGetResponse } = await request
      .patch(`${apiPath}/auth`)
      .auth(advertiserToken, { type: 'bearer' })
      .send(updateUser)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(body.status).toBe(Status.Success);
    expect(body.data.id).toBe(advertiserUserId);
    expect(body.data.surname).toBe(updateUser.surname);
    expect(body.data.name).toBe(updateUser.name);
    expect(body.data.middleName).toBe(updateUser.middleName);
    expect(body.data.phoneNumber).toBe(updateUser.phoneNumber);
    expect(body.data.city).toBe(updateUser.city);
    expect(body.data.country).toBe(updateUser.country);
    expect(body.data.locale).toBe(updateUser.locale);
    expect(body.data.preferredLanguage).toBe(updateUser.preferredLanguage);
    expect(body.data.company).toBe(updateUser.company);
    expect(body.data.companyLegalAddress).toBe(updateUser.companyLegalAddress);
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
   * Advertiser: Изменение аккаунта пользователя с паролем - неудача
   */
  test('Advertiser: PATCH /auth (Изменение аккаунта пользователя: неудача)', async () => {
    await request
      .patch(`${apiPath}/auth`)
      .auth(advertiserToken, { type: 'bearer' })
      .send({ ...updateUser, password: 'Gruodis19771203!' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  /**
   * Advertiser: Проверяет, авторизован ли пользователь и выдает о пользователе полную информацию
   */
  test('Advertiser: GET /auth (Выдает о пользователе полную информацию)', async () => {
    await request
      .get(`${apiPath}/auth`)
      .auth(advertiserToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: UserGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data.id).toBe(advertiserUserId);
        expect(body.data.password).toBeUndefined();
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
  });

  /**
   * Отправить на почту пользователю разрешение на смену пароля [отсутствие email]
   */
  test('POST /auth/reset-password [отсутствие email] (Отправить на почту пользователю разрешение на смену пароля)', async () => {
    await request
      .post(`${apiPath}/auth/reset-password`)
      .send({})
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  /**
   * Advertiser: Отправить на почту пользователю разрешение на смену пароля [succcess]
   */
  test('Advertiser: POST /auth/reset-password [success] (Отправить на почту пользователю разрешение на смену пароля)', async () => {
    const verify: ResetPasswordInvitationRequest = {
      email: advertiserUser?.email ?? '',
    };

    await request
      .post(`${apiPath}/auth/reset-password`)
      .send(verify)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: SuccessResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect((body as any)?.data?.password).toBeUndefined();
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
    if (!advertiserRefreshToken) {
      expect(false).toBe(true);
      return;
    }

    const verify: AuthRefreshRequest = {
      refreshToken: advertiserRefreshToken ?? '',
    };

    await request
      .post(`${apiPath}/auth/refresh`)
      .send(verify)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: AuthRefreshResponse }) => {
        expect(body.payload.token).toBeDefined();
        advertiserToken = body.payload.token ?? undefined;
        advertiserRefreshToken = body.payload.refreshToken;
      });
  });

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
   * Advertiser: Скрытие аккаунта пользователя
   */
  test('Advertiser: PATCH /auth/disable [success] (Скрытие аккаунта пользователя)', async () => {
    await request
      .patch(`${apiPath}/auth/disable`)
      .auth(advertiserToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: SuccessResponse }) => {
        expect(body.status).toBe(Status.Success);
      });
  });

  /**
   * Advertiser: Изменение через базу disabled: false
   */
  test('Advertiser: Change user Disabled: False (database access)', async () => {
    if (!advertiserUser) {
      expect(false).toEqual(true);
      return;
    }

    const userUpdate = await userService.update(advertiserUser, {
      disabled: false,
    });
    expect(userUpdate).toBeDefined();
    expect(userUpdate?.id).toBe(advertiserUserId);
  });

  /**
   * Accountant: Регистрация пользователя
   */
  test('Accountant: POST /auth/register', async () => {
    await request
      .post(`${apiPath}/auth/register`)
      .send(registerRequestAccountant)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)
      .then(({ body }: { body: UserGetResponse }) => {
        expect(body.data.id).toBeTruthy();
        expect((body.data as any).password).toBeUndefined();
        accountantUserId = body.data.id;
      });
  });
  /**
   * Accountant: Подтвердить email пользователя
   */
  test('Accountant: POST /auth/email-verify', async () => {
    accountantUser = await userService.findById(accountantUserId, {
      select: ['id', 'email', 'emailConfirmKey'],
    });
    if (accountantUser) {
      const verify: VerifyEmailRequest = {
        verify: generateMailToken(
          accountantUser.email,
          accountantUser.emailConfirmKey ?? '<undefined>',
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

      accountantUser = await userService.update(accountantUser, {
        role: UserRoleEnum.Accountant,
        plan: UserPlanEnum.VIP,
      });
      expect(accountantUser?.role).toBe(UserRoleEnum.Accountant);
    } else {
      expect(false).toEqual(true);
      return;
    }
  });
  /**
   * Accountant: Авторизация пользователя
   */
  test('Accountant: POST /auth/login', async () => {
    const { body }: { body: AuthResponse } = await request
      .post(`${apiPath}/auth/login`)
      .send(loginRequestAccountant)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(body.payload?.type).toBe('bearer');
    expect(body.data?.id).toBe(accountantUserId);
    expect(body.data.role).toBe(UserRoleEnum.Accountant);
    expect(body.data.planValidityPeriod).toBe(0);
    expect(body.data.surname).toBe(registerRequestAccountant.surname);
    expect(body.data.name).toBe(registerRequestAccountant.name);
    expect(body.data.middleName).toBe(registerRequestAccountant.middleName);
    expect(body.data.plan).toBe(UserPlanEnum.VIP);
    expect(body.payload?.token).toBeDefined();
    expect(body.payload?.refreshToken).toBeDefined();
    expect((body.data as any).password).toBeUndefined();

    accountantToken = body.payload.token;
    accountantRefreshToken = body.payload.refreshToken;
  });

  /**
   * MonitorOwner: Изменение аккаунта пользователя
   */
  test('MonitorOwner: PATCH /auth (Изменение пользователя)', async () => {
    const { body }: { body: UserGetResponse } = await request
      .patch(`${apiPath}/auth`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(updateUser)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);
    expect(body.status).toBe(Status.Success);
    expect(body.data.id).toBe(monitorOwnerUserId);
    expect(body.data.role).toBe(UserRoleEnum.MonitorOwner);
    expect(body.data.surname).toBe(updateUser.surname);
    expect(body.data.name).toBe(updateUser.name);
    expect(body.data.middleName).toBe(updateUser.middleName);
    expect(body.data.phoneNumber).toBe(updateUser.phoneNumber);
    expect(body.data.city).toBe(updateUser.city);
    expect(body.data.country).toBe(updateUser.country);
    expect(body.data.locale).toBe(updateUser.locale);
    expect(body.data.preferredLanguage).toBe(updateUser.preferredLanguage);
    expect(body.data.company).toBe(updateUser.company);
    expect(body.data.companyLegalAddress).toBe(updateUser.companyLegalAddress);
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
    expect(body.data.emailConfirmKey).toBeUndefined();
    expect(body.data.forgotConfirmKey).toBeUndefined();
  });

  /**
   * MonitorOwner: Выставление счета
   */
  test('MonitorOwner: PUT /invoice (Выставление счета)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const invoice: InvoiceCreateRequest = {
      sum: monitorOwnerInvoiceSum,
      description: 'Тестовый',
    };

    await request
      .put(`${apiPath}/invoice`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(invoice)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: InvoiceGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data?.user?.password).toBeUndefined();
        monitorOwnerInvoiceId = body.data.id;
      });
  });

  /**
   * Advertiser: Выставление счета
   */
  test('Advertiser: PUT /invoice (Выставление счета)', async () => {
    if (!advertiserToken) {
      expect(false).toEqual(true);
      return;
    }

    const invoice: InvoiceCreateRequest = {
      sum: advertiserInvoiceSum,
      description: 'Тестовый',
    };

    await request
      .put(`${apiPath}/invoice`)
      .auth(advertiserToken, { type: 'bearer' })
      .send(invoice)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: InvoiceGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data?.user?.password).toBeUndefined();
        advertiserInvoiceId = body.data.id;
      });
  });

  /**
   * Accountant: Закачка счета для monitorOwnerInvoiceId
   */
  test(`Accountant: POST /invoice/upload/{monitorOwnerInvoiceId} (Закачка счета)`, async () => {
    if (!accountantToken || !monitorOwnerInvoiceId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .post(`${apiPath}/invoice/upload/${monitorOwnerInvoiceId}`)
      .attach('file', fileXLS)
      .auth(accountantToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: InvoiceGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBe(monitorOwnerInvoiceId);
        expect(body.data.status).toBe(InvoiceStatus.AWAITING_CONFIRMATION);
        expect(body.data.file).toBeInstanceOf(Object);
        expect(body.data.file?.id).toBeTruthy();
        expect(body.data.file?.signedUrl).toBeDefined();
        expect(body.data?.user?.password).toBeUndefined();
      });
  });

  /**
   * Accountant: Закачка счета для advertiserInvoiceId
   */
  test(`Accountant: POST /invoice/upload/{advertiserInvoiceId} (Закачка счета)`, async () => {
    if (!accountantToken) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .post(`${apiPath}/invoice/upload/${advertiserInvoiceId}`)
      .attach('file', fileXLS)
      .auth(accountantToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: InvoiceGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBe(advertiserInvoiceId);
        expect(body.data.status).toBe(InvoiceStatus.AWAITING_CONFIRMATION);
        expect(body.data.file).toBeInstanceOf(Object);
        expect(body.data.file?.id).toBeTruthy();
        expect(body.data.file?.signedUrl).toBeDefined();
        expect(body.data?.user?.password).toBeUndefined();
      });
  });

  /**
   * Accountant: Подтверждение счета для monitorOwnerInvoiceId
   */
  test(`Accountant: GET /invoice/confirmed/{monitorOwnerInvoiceId} (Подтверждение счета)`, async () => {
    if (!accountantToken) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/invoice/confirmed/${monitorOwnerInvoiceId}`)
      .auth(accountantToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: InvoiceGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBe(monitorOwnerInvoiceId);
        expect(body.data.file).toBeInstanceOf(Object);
        expect(body.data.file?.id).toBeTruthy();
        expect(body.data.file?.signedUrl).toBeTruthy();
        expect(body.data.status).toBe(InvoiceStatus.CONFIRMED_PENDING_PAYMENT);
        expect(body.data?.user?.password).toBeUndefined();
      });
  });

  /**
   * Accountant: Подтверждение счета для advertiserInvoiceId
   */
  test(`Accountant: GET /invoice/confirmed/{advertiserInvoiceId} (Подтверждение счета)`, async () => {
    if (!accountantToken) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/invoice/confirmed/${advertiserInvoiceId}`)
      .auth(accountantToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: InvoiceGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBe(advertiserInvoiceId);
        expect(body.data.file).toBeInstanceOf(Object);
        expect(body.data.file?.id).toBeTruthy();
        expect(body.data.file?.signedUrl).toBeTruthy();
        expect(body.data.status).toBe(InvoiceStatus.CONFIRMED_PENDING_PAYMENT);
        expect(body.data?.user?.password).toBeUndefined();
      });
  });

  /**
   * Accountant: Оплата счета для monitorOwnerInvoiceId
   */
  test(`Accountant: GET /invoice/payed/{monitorOwnerInvoiceId} (Оплата счета)`, async () => {
    if (!accountantToken || !monitorOwnerInvoiceId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/invoice/payed/${monitorOwnerInvoiceId}`)
      .auth(accountantToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: InvoiceGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBe(monitorOwnerInvoiceId);
        expect(body.data.file).toBeInstanceOf(Object);
        expect(body.data.file?.id).toBeTruthy();
        expect(body.data.file?.signedUrl).toBeTruthy();
        expect(body.data.status).toBe(InvoiceStatus.PAID);
        expect(body.data?.user?.password).toBeUndefined();
      });
  });

  /**
   * Accountant: Оплата счета для advertiserInvoiceId
   */
  test(`Accountant: GET /invoice/payed/{advertiserInvoiceId} (Оплата счета)`, async () => {
    if (!accountantToken || !advertiserInvoiceId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/invoice/payed/${advertiserInvoiceId}`)
      .auth(accountantToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: InvoiceGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBe(advertiserInvoiceId);
        expect(body.data.file).toBeInstanceOf(Object);
        expect(body.data.file?.id).toBeTruthy();
        expect(body.data.file?.signedUrl).toBeTruthy();
        expect(body.data.status).toBe(InvoiceStatus.PAID);
        expect(body.data?.user?.password).toBeUndefined();
      });
  });

  /**
   * MonitorOwner: Скачивание счета
   */
  test('MonitorOwner: GET /invoice/download/{monitorOwnerInvoiceId}/xlsx (Скачивание счета)', async () => {
    if (!monitorOwnerToken || !monitorOwnerInvoiceId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/invoice/download/${monitorOwnerInvoiceId}/xlsx`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect(200)
      .then(({ body }: { body: Buffer }) => {
        expect(body).toBeInstanceOf(Object);
      });
  });

  /**
   * MonitorOwner: Выставление счета - 2
   */
  test('MonitorOwner: PUT /invoice (Выставление счета - 2)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const invoice: InvoiceCreateRequest = {
      sum: monitorOwnerInvoiceSum,
      description: 'Тестовый 2',
    };

    await request
      .put(`${apiPath}/invoice`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(invoice)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: InvoiceGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.status).toBe(InvoiceStatus.AWAITING_CONFIRMATION);
        expect(body.data?.user?.password).toBeUndefined();
        monitorOwnerInvoiceId2 = body.data.id;
      });
  });

  /**
   * Accountant: Подтверждение счета 2 для monitorOwnerInvoiceId2
   */
  // test(`Accountant: GET /invoice/confirmed/{monitorOwnerInvoiceId2} (Подтверждение счета 2)`, async () => {
  //   if (!accountantToken || !monitorOwnerInvoiceId2) {
  //     expect(false).toEqual(true);
  //     return;
  //   }

  //   await request
  //     .get(`${apiPath}/invoice/confirmed/${monitorOwnerInvoiceId2}`)
  //     .auth(accountantToken, { type: 'bearer' })
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .expect(200)
  //     .then(({ body }: { body: InvoiceGetResponse }) => {
  //       expect(body.status).toBe(Status.Success);
  //       expect(body.data).toBeInstanceOf(Object);
  //       expect(body.data.id).toBe(monitorOwnerInvoiceId2);
  //       expect(body.data.file).toBeInstanceOf(Object);
  //       expect(body.data.file?.id).toBeTruthy();
  //       expect(body.data.file?.signedUrl).toBeTruthy();
  //       expect(body.data.file?.filesize).toBeGreaterThan(0);
  //       monitorOwnerInvoiceFilesize2 = Number(body.data.file?.filesize || 0);
  //       expect(body.data.status).toBe(InvoiceStatus.CONFIRMED_PENDING_PAYMENT);
  //       expect(body.data?.user?.password).toBeUndefined();
  //     });
  // });

  /**
   * MonitorOwner: История операций
   */
  test('MonitorOwner: POST /wallet (История операций DEBIT)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const wallet: WalletOperationsGetRequest = {
      where: { type: WalletTransactionType.DEBIT },
      scope: {},
    };

    await request
      .post(`${apiPath}/wallet`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(wallet)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: WalletOperationsGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.count).toBe(1);
        expect(Number(body.data[0].sum)).toBe(monitorOwnerInvoiceSum);
        expect(body.data[0].invoiceId).toBe(monitorOwnerInvoiceId);
        expect(body.data[0].actId).toBeNull();
        expect(body.data[0].description).toBeDefined();
        expect(body.data[0]?.user?.password).toBeUndefined();
      });
  });

  /**
   * MonitorOwner: История операций
   */
  test('MonitorOwner: POST /wallet (История операций CREDIT)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const wallet: WalletOperationsGetRequest = {
      where: { type: WalletTransactionType.CREDIT },
      scope: {},
    };

    await request
      .post(`${apiPath}/wallet`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(wallet)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: WalletOperationsGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.count).toBe(1);
        expect(Number(body.data[0].sum)).toBe(
          0 - configService.getOrThrow('SUBSCRIPTION_FEE'),
        );
        expect(body.data[0].actId).toBeTruthy();
        expect(body.data[0].invoiceId).toBeNull();
        expect(body.data[0].description).toBe(
          configService.getOrThrow('SUBSCRIPTION_DESCRIPTION'),
        );
        expect(body.data[0]?.user?.password).toBeUndefined();
      });
  });

  /**
   * MonitorOwner: Получение списка папок
   */
  test('MonitorOwner: POST /folder (Получение списка папок)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const content = request
      .post(`${apiPath}/folder`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send({ where: {}, scope: {} })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    await content.then(({ body }: { body: FoldersGetResponse }) => {
      expect(body.status).toBe(Status.Success);
      expect(body.data).toBeInstanceOf(Object);
      expect(body.data?.[0]?.userId).toBeDefined();
    });
  });

  /**
   * WebSocket MonitorOwner: авторизация пользователя и проверка metrics и wallet
   */
  test("WebSocket MonitorOwner: 'auth/token' (Авторизация пользователя и проверка metrics и wallet)", async () => {
    if (!monitorOwnerToken) {
      expect(false).toBe(true);
      return;
    }

    wsMonitorOwner = new WebSocket(wsUrl);
    await new Promise((resolve) => wsMonitorOwner.on('open', resolve));

    wsMonitorOwner.send(
      JSON.stringify({
        event: 'auth/token',
        data: {
          token: monitorOwnerToken,
          date: new Date().toISOString(),
        },
      }),
    );
    const wsMessage = await new Promise<string>((resolve) => {
      wsMonitorOwner.on('message', (dataBuffer: Buffer) => {
        resolve(dataBuffer.toString('utf8'));
      });
    });

    expect(wsMessage).toBeDefined();
    const dataJson = JSON.parse(wsMessage);
    expect(dataJson).toBeDefined();
    const authorized = dataJson[0] as WsAuthObject;
    const wallet = dataJson[1] as WsWalletObject;
    const metrics = dataJson[2] as WsMetricsObject;
    expect(authorized).toBeDefined();
    expect(authorized.event).toBe(WsEvent.AUTH);
    expect(authorized.data).toBe('authorized');
    expect(wallet).toBeDefined();
    expect(wallet.event).toBe(WsEvent.WALLET);
    expect(wallet.data.total).toBe(
      monitorOwnerInvoiceSum - configService.getOrThrow('SUBSCRIPTION_FEE'),
    );
    expect(metrics).toBeDefined();
    expect(metrics.event).toBe(WsEvent.METRICS);
    expect(metrics.data).toBeDefined();
    expect(metrics.data.storageSpace.storage).toBe(
      fileXLSfilesize + monitorOwnerInvoiceFilesize2,
    );
    expect(metrics.data.monitors.user).toBe(0);
    expect(metrics.data.monitors.empty).toBe(0);
    expect(metrics.data.monitors.online).toBe(0);
    expect(metrics.data.monitors.offline).toBe(0);
    expect(metrics.data.playlists.added).toBe(0);
    expect(metrics.data.playlists.played).toBe(0);
    wsMonitorOwner.close();
  });

  /**
   * MonitorOwner: Регистрация монитора, тот что станет Mirror - 1
   */
  test('MonitorOwner: PUT /monitor (Регистрация монитора: тот, что станет Mirror - 1)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const monitor: MonitorCreateRequest = {
      name: monitorNameMirror1,
      code: monitorCodeMirror1,
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
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(monitor)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.user?.password).toBeUndefined();
        monitorMirror1Id = body.data.id;
      });
  });

  /**
   * MonitorOwner: Получение списка мониторов
   */
  test('MonitorOwner: POST /monitor (Получение списка мониторов)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const monitors: MonitorsGetRequest = {
      where: {
        name: '%',
        status: MonitorStatus.Offline,
        price1s: [0, 10000],
        minWarranty: [0, 10000],
        maxDuration: [0, 10000],
      },
      scope: {},
    };

    await request
      .post(`${apiPath}/monitor`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(monitors)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorsGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data[0].id).toBe(monitorMirror1Id);
        expect(body.data[0].bids).toBeUndefined();
        expect(body.data[0].playlist).toBeUndefined();
        expect(body.data[0].statistics).toBeUndefined();
        expect(body.data[0].monitorOnline).toBeUndefined();
        expect(body.data[0].groupMonitors).toBeUndefined();
        expect(body.data[0].user?.password).toBeUndefined();
      });
  });

  /**
   * MonitorOwner: Регистрация монитора, тот что станет Mirror - 2
   */
  test('MonitorOwner: PUT /monitor (Регистрация монитора: тот, что станет Mirror - 2)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const monitor: MonitorCreateRequest = {
      name: monitorNameMirror2,
      code: monitorCodeMirror2,
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
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(monitor)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.user?.password).toBeUndefined();
        monitorMirror2Id = body.data.id;
      });
  });

  /**
   * MonitorOwner: Регистрация группового монитора Mirror
   */
  test('MonitorOwner: PUT /monitor (Регистрация группового монитора Mirror)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const monitor: MonitorCreateRequest = {
      name: monitorNameGroupMirror,
      code: monitorCodeGroupMirror,
      price1s: 0.1,
      minWarranty: 10,
      maxDuration: 10000,
      width: 1920,
      height: 1080,
      address: {},
      category: MonitorCategoryEnum.ATM,
      orientation: MonitorOrientation.Horizontal,
      multiple: MonitorMultiple.MIRROR,
      sound: true,
      angle: 0,
      brightness: 0,
      groupIds: [
        { monitorId: monitorMirror1Id, row: 0, col: 0 },
        { monitorId: monitorMirror2Id, row: 0, col: 0 },
      ],
    };

    await request
      .put(`${apiPath}/monitor`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(monitor)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.user?.password).toBeUndefined();
        monitorGroupMirrorId = body.data.id;
      });
  });

  /**
   * MonitorOwner: Получение группового монитора Mirror
   */
  test('MonitorOwner: GET /monitor/{monitorGroupMirrorId} (Получение группового монитора Mirror)', async () => {
    if (!monitorOwnerToken || !monitorGroupMirrorId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/monitor/${monitorGroupMirrorId}`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.multiple).toBe(MonitorMultiple.MIRROR);
        expect(body.data.groupIds).toBeInstanceOf(Object);
        const re = RegExp(`${monitorMirror1Id}|${monitorMirror2Id}`);
        expect(body.data.groupIds?.[0]?.monitorId).toMatch(re);
        expect(body.data.groupIds?.[0]?.row).toBeDefined();
        expect(body.data.groupIds?.[0]?.col).toBeDefined();
        expect(body.data.groupIds?.[1]?.monitorId).toMatch(re);
        expect(body.data.groupIds?.[1]?.row).toBeDefined();
        expect(body.data.groupIds?.[1]?.col).toBeDefined();
        expect(body.data.user?.password).toBeUndefined();
      });
  });

  /**
   * MonitorOwner: Регистрация монитора, тот что станет Scaling - 1
   */
  test('MonitorOwner: PUT /monitor (Регистрация монитора: тот, что станет Scaling - 1)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const monitor: MonitorCreateRequest = {
      name: monitorNameScaling1,
      code: monitorCodeScaling1,
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
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(monitor)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.user?.password).toBeUndefined();
        monitorScaling1Id = body.data.id;
      });
  });

  /**
   * MonitorOwner: Регистрация монитора, тот что станет Scaling - 2
   */
  test('MonitorOwner: PUT /monitor (Регистрация монитора: тот, что станет Scaling - 2)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const monitor: MonitorCreateRequest = {
      name: monitorNameScaling2,
      code: monitorCodeScaling2,
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
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(monitor)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.user?.password).toBeUndefined();
        monitorScaling2Id = body.data.id;
      });
  });

  /**
   * MonitorOwner: Регистрация монитора, тот что станет Scaling - 3
   */
  test('MonitorOwner: PUT /monitor (Регистрация монитора: тот, что станет Scaling - 3)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const monitor: MonitorCreateRequest = {
      name: monitorNameScaling3,
      code: monitorCodeScaling3,
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
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(monitor)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.user?.password).toBeUndefined();
        monitorScaling3Id = body.data.id;
      });
  });

  /**
   * MonitorOwner: Регистрация монитора, тот что станет Scaling - 4
   */
  test('MonitorOwner: PUT /monitor (Регистрация монитора: тот, что станет Scaling - 4)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const monitor: MonitorCreateRequest = {
      name: monitorNameScaling4,
      code: monitorCodeScaling4,
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
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(monitor)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.user?.password).toBeUndefined();
        monitorScaling4Id = body.data.id;
      });
  });

  /**
   * MonitorOwner: Регистрация группового монитора Scaling
   */
  test('MonitorOwner: PUT /monitor (Регистрация группового монитора Scaling)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const monitor: MonitorCreateRequest = {
      name: monitorNameGroupScaling,
      code: monitorCodeGroupScaling,
      price1s: 0.00001,
      minWarranty: 10,
      maxDuration: 10000,
      width: 1920,
      height: 1080,
      address: {},
      category: MonitorCategoryEnum.ATM,
      orientation: MonitorOrientation.Horizontal,
      multiple: MonitorMultiple.SCALING,
      sound: true,
      angle: 0,
      brightness: 0,
      groupIds: [
        { monitorId: monitorScaling1Id, row: 0, col: 0 },
        { monitorId: monitorScaling2Id, row: 0, col: 1 },
        { monitorId: monitorScaling3Id, row: 1, col: 0 },
        { monitorId: monitorScaling4Id, row: 1, col: 1 },
      ],
    };

    await request
      .put(`${apiPath}/monitor`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(monitor)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.user?.password).toBeUndefined();
        monitorGroupScalingId = body.data.id;
      });
  });

  /**
   * MonitorOwner: Получение группового монитора Scaling
   */
  test('MonitorOwner: GET /monitor/{monitorGroupScalingId} (Получение группового монитора Scaling)', async () => {
    if (!monitorOwnerToken || !monitorGroupScalingId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/monitor/${monitorGroupScalingId}`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.multiple).toBe(MonitorMultiple.SCALING);
        expect(body.data.groupIds).toBeInstanceOf(Object);
        expect(body.data.groupIds?.[0]?.monitorId).toBeTruthy();
        expect(body.data.groupIds?.[0]?.row).toBeDefined();
        expect(body.data.groupIds?.[0]?.col).toBeDefined();
        expect(body.data.groupIds?.[1]?.monitorId).toBeTruthy();
        expect(body.data.groupIds?.[1]?.row).toBeDefined();
        expect(body.data.groupIds?.[1]?.col).toBeDefined();
        expect(body.data.groupIds?.[2]?.monitorId).toBeTruthy();
        expect(body.data.groupIds?.[2]?.row).toBeDefined();
        expect(body.data.groupIds?.[2]?.col).toBeDefined();
        expect(body.data.groupIds?.[3]?.monitorId).toBeTruthy();
        expect(body.data.groupIds?.[3]?.row).toBeDefined();
        expect(body.data.groupIds?.[3]?.col).toBeDefined();
        expect(body.data.user?.password).toBeUndefined();
      });
  });

  /**
   * MonitorOwner: Регистрация монитора Single
   */
  test('MonitorOwner: PUT /monitor (Регистрация монитора: Single)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    const monitor: Omit<MonitorCreateRequest, 'price1s'> & {
      price1s: string;
    } = {
      name: monitorNameSingle,
      code: monitorCodeSingle,
      price1s: '0.00001',
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
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(monitor)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.user?.password).toBeUndefined();
        monitorSingleId = body.data.id;
      });
  });

  /**
   * MonitorOwner: Картинки монитора Single
   */
  test('MonitorOwner: PUT /monitor/{monitorSingleId}/upload-photos (Картинки монитора Single)', async () => {
    if (!monitorOwnerToken || !monitorSingleId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .put(`${apiPath}/monitor/${monitorSingleId}/upload-photos`)
      .attach('files', imageTestingDirname)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.user?.password).toBeUndefined();
      });
  });

  /**
   * MonitorOwner: Документы монитора Single
   */
  test('MonitorOwner: PUT /monitor/{monitorSingleId}/upload-documents (Документы монитора Single)', async () => {
    if (!monitorOwnerToken || !monitorSingleId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .put(`${apiPath}/monitor/${monitorSingleId}/upload-documents`)
      .attach('files', fileXLS)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.user?.password).toBeUndefined();
      });
  });

  /**
   * WebSocket MonitorOwner: авторизация пользователя и проверка metrics и wallet
   */
  test("WebSocket MonitorOwner: 'auth/token' (Авторизация пользователя и проверка metrics и wallet)", async () => {
    if (!monitorOwnerToken) {
      expect(false).toBe(true);
    }

    wsMonitorOwner = new WebSocket(wsUrl);
    await new Promise((resolve) => wsMonitorOwner.on('open', resolve));

    wsMonitorOwner.send(
      JSON.stringify({
        event: 'auth/token',
        data: {
          token: monitorOwnerToken,
          date: new Date().toISOString(),
        },
      }),
    );
    const wsMessage = await new Promise<string>((resolve) => {
      wsMonitorOwner.on('message', (dataBuffer: Buffer) => {
        resolve(dataBuffer.toString('utf8'));
      });
    });

    expect(wsMessage).toBeDefined();
    const dataJson = JSON.parse(wsMessage);
    expect(dataJson).toBeDefined();
    const authorized = dataJson[0] as WsAuthObject;
    const wallet = dataJson[1] as WsWalletObject;
    const metrics = dataJson[2] as WsMetricsObject;
    expect(authorized).toBeDefined();
    expect(authorized.event).toBe(WsEvent.AUTH);
    expect(authorized.data).toBe('authorized');
    expect(wallet).toBeDefined();
    expect(wallet.event).toBe(WsEvent.WALLET);
    expect(wallet.data.total).toBe(
      monitorOwnerInvoiceSum - configService.getOrThrow('SUBSCRIPTION_FEE'),
    );
    expect(metrics).toBeDefined();
    expect(metrics.event).toBe(WsEvent.METRICS);
    expect(metrics.data).toBeDefined();
    expect(metrics.data.monitors).toBeDefined();
    expect(metrics.data.monitors.user).toBe(MONITOR_OWNER_MONITOR_COUNT_USER);
    expect(metrics.data.monitors.online).toBe(
      MONITOR_OWNER_MONITOR_COUNT_ONLINE,
    );
    expect(metrics.data.monitors.offline).toBe(
      MONITOR_OWNER_MONITOR_COUNT_OFFLINE,
    );
    expect(metrics.data.monitors.empty).toBe(MONITOR_OWNER_MONITOR_COUNT_EMPTY);
    expect(metrics.data.storageSpace.storage).toBe(
      2 * fileXLSfilesize + imageTestingFilesize + monitorOwnerInvoiceFilesize2,
    );
    expect(metrics.data.playlists.added).toBe(0);
    expect(metrics.data.playlists.played).toBe(0);
    wsMonitorOwner.close();
  });

  /**
   * MonitorOwner: Создание новой папки
   */
  test('MonitorOwner: PUT /folder [name: "bar"] (Создание новой папки)', async () => {
    await request
      .put(`${apiPath}/folder`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send({ name: 'bar' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)
      .then(({ body }: { body: FolderGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data.id).toBeTruthy();
        expect(body.data.parentFolderId).toBeTruthy();
        expect(body.data.name).toBe('bar');
        expect((body.data as any)?.user?.password).toBeUndefined();
        monitorOwnerFolderBarId = body.data.id;
        monitorOwnerRootFolderId = body.data.parentFolderId;
      });
  });

  test('MonitorOwner: PUT /folder [name: "baz"] (Создание новой папки)', async () => {
    await request
      .put(`${apiPath}/folder`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send({ name: 'baz' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)
      .then(({ body }: { body: FolderGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data.id).toBeTruthy();
        expect(body.data.name).toBe('baz');
        expect((body.data as any)?.user?.password).toBeUndefined();
        monitorOwnerFolderBazId = body.data.id;
      });
  });

  /**
   * MonitorOwner: Получение информации о папке
   */
  test('MonitorOwner: GET /folder/{monitorOwnerFolderBarId} (Получение информации о папке)', async () => {
    if (!monitorOwnerToken || !monitorOwnerFolderBarId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/folder/${monitorOwnerFolderBarId}`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: FolderGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBe(monitorOwnerFolderBarId);
        expect(body.data.name).toBe('bar');
        expect((body.data as any)?.user?.password).toBeUndefined();
      });
  });

  /**
   * MonitorOwner: Удаление папки
   */
  test('MonitorOwner: DELETE /folder/{monitorOwnerFolderBazId} (Удаление папки)', async () => {
    if (!monitorOwnerToken || !monitorOwnerFolderBazId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .delete(`${apiPath}/folder/${monitorOwnerFolderBazId}`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: SuccessResponse }) => {
        expect(body.status).toBe(Status.Success);
      });
  });

  /**
   * MonitorOwner: Создание новой под-папки
   */
  test('MonitorOwner: PUT /folder (Создание новой под-папки: /bar/foo)', async () => {
    await request
      .put(`${apiPath}/folder`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send({ name: 'foo', parentFolderId: monitorOwnerFolderBarId })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)
      .then(({ body }: { body: FolderGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data.id).toBeTruthy();
        expect(body.data.name).toBe('foo');
        expect(body.data.parentFolderId).toBe(monitorOwnerFolderBarId);
        expect((body.data as any)?.user?.password).toBeUndefined();
        monitorOwnerFolderFooId = body.data.id;
      });
  });

  /**
   * MonitorOwner: Создание новой под-папки
   */
  test('MonitorOwner: PUT /folder (Создание новой под-папки: /bar/baz)', async () => {
    await request
      .put(`${apiPath}/folder`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send({ name: 'baz', parentFolderId: monitorOwnerFolderBarId })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)
      .then(({ body }: { body: FolderGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data.id).toBeTruthy();
        expect(body.data.name).toBe('baz');
        expect(body.data.parentFolderId).toBe(monitorOwnerFolderBarId);
        expect((body.data as any)?.user?.password).toBeUndefined();
        monitorOwnerFolderBazId = body.data.id;
      });
  });

  /**
   * MonitorOwner: Загрузка файлов в папку /bar/foo
   */
  test('MonitorOwner: PUT /file (Загрузка файлов в папку /bar/foo)', async () => {
    if (!monitorOwnerToken || !monitorOwnerFolderFooId) {
      expect(false).toEqual(true);
      return;
    }

    const folderId = monitorOwnerFolderFooId;
    const files = imageTestingDirname;

    const { body }: { body: FilesUploadResponse } = await request
      .put(`${apiPath}/file`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .field({ folderId })
      .attach('files', files)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body.status).toBe(Status.Success);
    expect(body.data).toBeInstanceOf(Object);
    expect(body.data[0].id).toBeTruthy();
    monitorOwnerImageId = body.data[0].id;
    expect(body.data[0]?.user?.password).toBeUndefined();
  });

  /**
   * MonitorOwner: Получение списка файлов (неуспешно)
   */
  test('MonitorOwner: POST /file (Получение списка файлов, неуспешно)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .post(`${apiPath}/file`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send({
        where: { folderId: '111' },
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });

  /**
   * MonitorOwner: Скачивание медиа
   */
  test('MonitorOwner: GET /file/download/{monitorOwnerImageId} (Скачивание картинки)', async () => {
    if (!monitorOwnerToken || !monitorOwnerImageId) {
      expect(false).toEqual(true);
      return;
    }

    const { body }: { body: HttpError | Buffer } = await request
      .get(`${apiPath}/file/download/${monitorOwnerImageId}`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect(200);

    expect((body as HttpError)?.status).toBeUndefined();
    expect(body).toBeInstanceOf(Buffer);
    const diff = body.compare(imageTestingBuffer);
    expect(diff).toBe(0);
  });

  /**
   * MonitorOwner: Скачивание предпросмотра
   */
  test('MonitorOwner: GET /file/preview/{monitorOwnerImageId} (Скачивание предпросмотра)', async () => {
    if (!monitorOwnerToken || !monitorOwnerImageId) {
      expect(false).toEqual(true);
      return;
    }

    const { body }: { body: HttpError | string } = await request
      .get(`${apiPath}/file/preview/${monitorOwnerImageId}`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect(200);

    expect((body as HttpError)?.status).toBeUndefined();
    expect(body).toBeInstanceOf(Buffer);
  });

  /**
   * MonitorOwner: Загрузка файлов в папку /bar/baz
   */
  test('MonitorOwner: PUT /file (Загрузка файлов в папку /bar/baz)', async () => {
    if (!monitorOwnerToken || !monitorOwnerFolderBazId) {
      expect(false).toEqual(true);
      return;
    }

    const folderId = monitorOwnerFolderBazId;
    const files = imageTestingDirname;

    const { body }: { body: FilesUploadResponse } = await request
      .put(`${apiPath}/file`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .field({ folderId })
      .attach('files', files)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body.status).toBe(Status.Success);
    expect(body.data).toBeInstanceOf(Object);
    expect(body.data[0].id).toBeTruthy();
    monitorOwnerImageId1 = body.data[0].id;
    expect(body.data[0]?.user?.password).toBeUndefined();
  });

  /**
   * MonitorOwner: Копирование папок
   */
  test('MonitorOwner: PATCH /folder/copy (Копирование папок)', async () => {
    if (
      !monitorOwnerToken ||
      !monitorOwnerRootFolderId ||
      !monitorOwnerFolderBazId
    ) {
      expect(false).toEqual(true);
      return;
    }

    const folderCopy: FoldersCopyRequest = {
      toFolder: monitorOwnerRootFolderId,
      folders: [{ id: monitorOwnerFolderBazId }],
    };

    const { body }: { body: HttpError | FoldersGetResponse } = await request
      .patch(`${apiPath}/folder/copy`)
      .send(folderCopy)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect(200);

    expect(body).toBeInstanceOf(Object);
    expect(body.status).toBe(Status.Success);
  });

  /**
   * Advertiser: Загрузка файлов
   */
  test('Advertiser: PUT /file (Загрузка файлов)', async () => {
    if (!advertiserToken) {
      expect(false).toEqual(true);
      return;
    }

    const files = videoTestingDirname;

    const { body }: { body: FilesUploadResponse } = await request
      .put(`${apiPath}/file`)
      .auth(advertiserToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .attach('files', files)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body.status).toBe(Status.Success);
    expect(body.data).toBeInstanceOf(Object);
    expect(body.data[0].id).toBeTruthy();
    advertiserVideoId = body.data[0].id;
    expect(body.data[0]?.user?.password).toBeUndefined();
  });

  /**
   * Advertiser: Создаем плэйлист из видео
   */
  test('Advertiser: PUT /playlist (Создаем плэйлист)', async () => {
    if (!advertiserToken || !advertiserVideoId) {
      expect(false).toEqual(true);
      return;
    }

    const playlistCreate: PlaylistCreateRequest = {
      name: 'Testing from e2e',
      description: 'testing from e2e',
      files: [advertiserVideoId],
    };

    await request
      .put(`${apiPath}/playlist`)
      .auth(advertiserToken, { type: 'bearer' })
      .send(playlistCreate)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: PlaylistGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data?.files?.[0]?.id).toBe(advertiserVideoId);
        expect(body.data.user?.password).toBeUndefined();
        advertiserPlaylistId1 = body.data.id;
      });
  });

  /**
   * WebSocket MonitorOwner: авторизация пользователя и проверка metrics и wallet
   */
  test("WebSocket MonitorOwner: 'auth/token' (Авторизация пользователя и проверка metrics и wallet)", async () => {
    if (!monitorOwnerToken) {
      expect(false).toBe(true);
    }

    wsMonitorOwner = new WebSocket(wsUrl);
    await new Promise((resolve) => wsMonitorOwner.on('open', resolve));

    wsMonitorOwner.send(
      JSON.stringify({
        event: 'auth/token',
        data: {
          token: monitorOwnerToken,
          date: new Date().toISOString(),
        },
      }),
    );
    const wsMessage = await new Promise<string>((resolve) => {
      wsMonitorOwner.on('message', (dataBuffer: Buffer) => {
        resolve(dataBuffer.toString('utf8'));
      });
    });

    expect(wsMessage).toBeDefined();
    const dataJson = JSON.parse(wsMessage);
    expect(dataJson).toBeDefined();
    const authorized = dataJson[0] as WsAuthObject;
    const wallet = dataJson[1] as WsWalletObject;
    const metrics = dataJson[2] as WsMetricsObject;
    expect(authorized).toBeDefined();
    expect(authorized.event).toBe(WsEvent.AUTH);
    expect(authorized.data).toBe('authorized');
    expect(wallet).toBeDefined();
    expect(wallet.event).toBe(WsEvent.WALLET);
    expect(wallet.data.total).toBe(
      monitorOwnerInvoiceSum - configService.getOrThrow('SUBSCRIPTION_FEE'),
    );
    expect(metrics).toBeDefined();
    expect(metrics.event).toBe(WsEvent.METRICS);
    expect(metrics.data).toBeDefined();
    expect(metrics.data.monitors).toBeDefined();
    expect(metrics.data.monitors.user).toBe(MONITOR_OWNER_MONITOR_COUNT_USER);
    expect(metrics.data.monitors.online).toBe(
      MONITOR_OWNER_MONITOR_COUNT_ONLINE,
    );
    expect(metrics.data.monitors.offline).toBe(
      MONITOR_OWNER_MONITOR_COUNT_OFFLINE,
    );
    expect(metrics.data.monitors.empty).toBe(MONITOR_OWNER_MONITOR_COUNT_EMPTY);
    expect(metrics.data.storageSpace.storage).toBe(
      4 * imageTestingFilesize +
        2 * fileXLSfilesize +
        monitorOwnerInvoiceFilesize2,
    );
    expect(metrics.data.playlists.added).toBe(0);
    expect(metrics.data.playlists.played).toBe(0);
    wsMonitorOwner.close();
  });

  /**
   * WebSocket Advertiser: авторизация пользователя и проверка metrics и wallet
   */
  test("WebSocket Advertiser: 'auth/token' (Авторизация пользователя и проверка metrics и wallet)", async () => {
    wsAdvertiser = new WebSocket(wsUrl);
    await new Promise((resolve) => wsAdvertiser.on('open', resolve));

    wsAdvertiser.send(
      JSON.stringify({
        event: 'auth/token',
        data: {
          token: advertiserToken,
          date: new Date().toISOString(),
        },
      }),
    );
    const wsMessage = await new Promise<string>((resolve) => {
      wsAdvertiser.on('message', (dataBuffer: Buffer) => {
        resolve(dataBuffer.toString('utf8'));
      });
    });

    expect(wsMessage).toBeDefined();
    const dataJson = JSON.parse(wsMessage);
    expect(dataJson).toBeDefined();
    const authorized = dataJson[0] as WsAuthObject;
    const wallet = dataJson[1] as WsWalletObject;
    const metrics = dataJson[2] as WsMetricsObject;
    expect(authorized).toBeDefined();
    expect(authorized.event).toBe(WsEvent.AUTH);
    expect(authorized.data).toBe('authorized');
    expect(wallet).toBeDefined();
    expect(wallet.event).toBe(WsEvent.WALLET);
    expect(wallet.data.total).toBe(advertiserInvoiceSum);
    expect(metrics).toBeDefined();
    expect(metrics.event).toBe(WsEvent.METRICS);
    expect(metrics.data).toBeDefined();
    expect(metrics.data.monitors).toBeDefined();
    expect(metrics.data.monitors.user).toBe(0);
    expect(metrics.data.monitors.online).toBe(0);
    expect(metrics.data.monitors.offline).toBe(0);
    expect(metrics.data.monitors.empty).toBe(0);
    expect(metrics.data.storageSpace.storage).toBe(
      videoTestingFilesize + fileXLSfilesize,
    );
    expect(metrics.data.playlists.added).toBe(1);
    expect(metrics.data.playlists.played).toBe(0);
    wsAdvertiser.close();
  });

  /**
   * Advertiser: Создаем редактор
   */
  test('Advertiser: PUT /editor (Создаем редактор)', async () => {
    if (!advertiserToken) {
      expect(false).toEqual(true);
      return;
    }

    const editorCreate: EditorCreateRequest = {
      name: 'Testing from e2e',
      width: 1920,
      height: 1080,
      fps: 24,
      keepSourceAudio: true,
    };

    await request
      .put(`${apiPath}/editor`)
      .auth(advertiserToken, { type: 'bearer' })
      .send(editorCreate)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: EditorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.user?.password).toBeUndefined();
        advertiserEditorId = body.data.id;
      });
  });

  /**
   * Advertiser: Создаем слой редактора
   */
  test('Advertiser: PUT /editor/layer/{advertiserEditorId} (Создаем слой редактора - 1)', async () => {
    if (!advertiserToken || !advertiserVideoId || !advertiserEditorId) {
      expect(false).toEqual(true);
      return;
    }

    const editorLayerCreate: EditorLayerCreateRequest = {
      index: 1,
      duration: 10,
      cutFrom: 0,
      cutTo: 10,
      start: 0,
      mixVolume: 1,
      file: advertiserVideoId,
    };

    await request
      .put(`${apiPath}/editor/layer/${advertiserEditorId}`)
      .auth(advertiserToken, { type: 'bearer' })
      .send(editorLayerCreate)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: EditorLayerGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.fileId).toBe(advertiserVideoId);
        expect(body.data.cutFrom).toBeTruthy();
        expect(body.data.cutTo).toBeTruthy();
        expect(body.data.duration).toBeTruthy();
        expect(body.data.index).toBe(1);
        expect(body.data.mixVolume).toBe(1);
      });
  });

  /**
   * Advertiser: Создаем слой редактора
   */
  test('Advertiser: PUT /editor/layer/{advertiserEditorId} (Создаем слой редактора - 2)', async () => {
    if (!advertiserToken || !advertiserVideoId || !advertiserEditorId) {
      expect(false).toEqual(true);
      return;
    }

    const editorLayerCreate: Omit<
      EditorLayerCreateRequest,
      'duration' | 'cutFrom' | 'cutTo' | 'start'
    > & { duration: string; cutFrom: string; cutTo: string; start: string } = {
      index: 2,
      duration: '10',
      cutFrom: '0',
      cutTo: '10',
      start: '10',
      mixVolume: 0,
      file: advertiserVideoId,
    };

    await request
      .put(`${apiPath}/editor/layer/${advertiserEditorId}`)
      .auth(advertiserToken, { type: 'bearer' })
      .send(editorLayerCreate)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: EditorLayerGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.fileId).toBe(advertiserVideoId);
        expect(body.data.cutFrom).toBeTruthy();
        expect(body.data.cutTo).toBeTruthy();
        expect(body.data.duration).toBeTruthy();
        expect(body.data.index).toBe(2);
        expect(body.data.mixVolume).toBe(0);
      });
  });

  /**
   * Advertiser: Запуск редактора
   */
  test('Advertiser: POST /editor/export/{advertiserEditorId} (Запуск редактора)', async () => {
    if (!advertiserToken || !advertiserVideoId || !advertiserEditorId) {
      expect(false).toEqual(true);
      return;
    }

    const editorExportCreate: EditorExportRequest = {
      rerender: false,
    };

    await request
      .post(`${apiPath}/editor/export/${advertiserEditorId}`)
      .auth(advertiserToken, { type: 'bearer' })
      .send(editorExportCreate)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: EditorGetRenderingStatusResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
        expect(body.data.renderingStatus).toBe(RenderingStatus.Initial);
      });
  });

  /**
   * Advertiser: Проверка редактора
   */
  test('Advertiser: GET /editor/export/{advertiserEditorId} (Проверка редактора)', async () => {
    if (!advertiserToken || !advertiserVideoId || !advertiserEditorId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/editor/export/${advertiserEditorId}`)
      .auth(advertiserToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: EditorGetRenderingStatusResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBeTruthy();
      });
  });

  /**
   * MonitorOwner: Лайк монитора Single
   */
  test('MonitorOwner: GET /monitor/{monitorSingleId}/favoritePlus (Лайк монитора Single)', async () => {
    if (!monitorOwnerToken || !monitorSingleId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/monitor/${monitorSingleId}/favoritePlus`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.user?.password).toBeUndefined();
        expect(body.data.favorite).toBe(true);
      });
  });

  /**
   * MonitorOwner: Дизлайк монитора Single
   */
  test('MonitorOwner: GET /monitor/{monitorSingleId}/favoriteMinus (Дизлайк монитора Single)', async () => {
    if (!monitorOwnerToken || !monitorSingleId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/monitor/${monitorSingleId}/favoriteMinus`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.user?.password).toBeUndefined();
        expect(body.data.favorite).toBe(false);
      });
  });

  /**
   * MonitorOwner: Лайк монитора Mirror
   */
  test('MonitorOwner: GET /monitor/{monitorGroupMirrorId}/favoritePlus (Лайк монитора Mirror)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/monitor/${monitorGroupMirrorId}/favoritePlus`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.user?.password).toBeUndefined();
        expect(body.data.id).toBe(monitorGroupMirrorId);
        expect(body.data.favorite).toBe(true);
      });
  });

  /**
   * MonitorOwner: Дизлайк монитора Mirror
   */
  test('MonitorOwner: GET /monitor/{monitorGroupMirrorId}/favoriteMinus (Дизлайк монитора Mirror)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/monitor/${monitorGroupMirrorId}/favoriteMinus`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.user?.password).toBeUndefined();
        expect(body.data.id).toBe(monitorGroupMirrorId);
        expect(body.data.favorite).toBe(false);
      });
  });

  /**
   * MonitorOwner: Лайк монитора Scaling
   */
  test('MonitorOwner: GET /monitor/{monitorGroupScalingId}/favoritePlus (Лайк монитора Scaling)', async () => {
    if (!monitorOwnerToken || !monitorGroupScalingId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/monitor/${monitorGroupScalingId}/favoritePlus`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.user?.password).toBeUndefined();
        expect(body.data.favorite).toBe(true);
      });
  });

  /**
   * MonitorOwner: Дизлайк монитора Scaling
   */
  test('MonitorOwner: GET /monitor/{monitorGroupScalingId}/favoriteMinus (Дизлайк монитора Scaling)', async () => {
    if (!monitorOwnerToken || !monitorGroupScalingId) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .get(`${apiPath}/monitor/${monitorGroupScalingId}/favoriteMinus`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.user?.password).toBeUndefined();
        expect(body.data.favorite).toBe(false);
      });
  });

  /**
   * Advertiser: Отправка плэйлиста на монитор Single
   */
  test('Advertiser: PATCH /monitor/playlist (Отправка плэйлиста на монитор Single)', async () => {
    if (!advertiserToken || !advertiserPlaylistId1 || !monitorSingleId) {
      expect(false).toEqual(true);
      return;
    }

    const playlistToMonitor: MonitorsPlaylistAttachRequest = {
      playlistId: advertiserPlaylistId1,
      monitorIds: [monitorSingleId],
      bid: {
        dateBefore: dayjs().add(1).toDate(),
        dateWhen: dayjs().subtract(1, 'day').toDate(),
        playlistChange: true,
      },
    };

    await request
      .patch(`${apiPath}/monitor/playlist`)
      .auth(advertiserToken, { type: 'bearer' })
      .send(playlistToMonitor)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: BidsGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.count).toBe(1);
        expect(body.data[0].id).toBeTruthy();
        expect(body.data[0].status).toBe(BidStatus.OK);
        expect(body.data[0].approved).toBe(BidApprove.NOTPROCESSED);
        advertiserBidMonitorSingleId = body.data[0].id;
      });
  });

  /**
   * MonitorOwner: Список заявок
   */
  test('MonitorOwner: POST /bid (Список заявок)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .post(`${apiPath}/bid`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: BidsGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data[0]?.id).toBe(advertiserBidMonitorSingleId);
      });
  });

  /**
   * MonitorOwner: Получение списка мониторов
   */
  test('MonitorOwner: POST /monitor (Получение списка мониторов)', async () => {
    if (!monitorOwnerToken) {
      expect(false).toEqual(true);
      return;
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
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(monitors)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: MonitorsGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data[0].id).toBeTruthy();
        expect(body.data[0].bids).toBeUndefined();
        expect(body.data[0].playlist).toBeUndefined();
        expect(body.data[0].statistics).toBeUndefined();
        expect(body.data[0].monitorOnline).toBeUndefined();
        expect(body.data[0].groupMonitors).toBeUndefined();
        expect(body.data[0].user?.password).toBeUndefined();
      });
  });

  /**
   * MonitorOwner: Утверждение заявки advertiserBidMonitorSingleId
   */
  test('MonitorOwner: PATCH /bid/{advertiserBidMonitorSingleId} (Утверждение заявки)', async () => {
    if (!monitorOwnerToken || !advertiserBidMonitorSingleId) {
      expect(false).toEqual(true);
      return;
    }

    const bid: BidUpdateRequest = {
      approved: BidApprove.ALLOWED,
    };

    await request
      .patch(`${apiPath}/bid/${advertiserBidMonitorSingleId}`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(bid)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: BidGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBe(advertiserBidMonitorSingleId);
        expect(body.data.status).toBe(BidStatus.OK);
        expect(body.data.approved).toBe(BidApprove.ALLOWED);
      });
  });

  /**
   * Advertiser: Отправка плэйлиста на монитор Mirror
   */
  test('Advertiser: PATCH /monitor/playlist (Отправка плэйлиста на монитор Mirror)', async () => {
    if (!advertiserToken || !advertiserPlaylistId1 || !monitorGroupMirrorId) {
      expect(false).toEqual(true);
      return;
    }

    const playlistToMonitor: MonitorsPlaylistAttachRequest = {
      playlistId: advertiserPlaylistId1,
      monitorIds: [monitorGroupMirrorId],
      bid: {
        dateBefore: dayjs().add(1).toDate(),
        dateWhen: dayjs().subtract(1, 'day').toDate(),
        playlistChange: true,
      },
    };

    await request
      .patch(`${apiPath}/monitor/playlist`)
      .auth(advertiserToken, { type: 'bearer' })
      .send(playlistToMonitor)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: BidsGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.count).toBe(1);
        expect(body.data[0].id).toBeTruthy();
        expect(body.data[0].status).toBe(BidStatus.OK);
        expect(body.data[0].approved).toBe(BidApprove.NOTPROCESSED);
        advertiserBidMonitorMirrorId = body.data[0].id;
      });
  });

  /**
   * MonitorOwner: Утверждение заявки advertiserBidMonitorMirrorId
   */
  test('MonitorOwner: PATCH /bid/{advertiserBidMonitorMirrorId} (Утверждение заявки)', async () => {
    if (!monitorOwnerToken || !advertiserBidMonitorMirrorId) {
      expect(false).toEqual(true);
      return;
    }

    const bid: BidUpdateRequest = {
      approved: BidApprove.ALLOWED,
    };

    await request
      .patch(`${apiPath}/bid/${advertiserBidMonitorMirrorId}`)
      .auth(monitorOwnerToken, { type: 'bearer' })
      .send(bid)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: BidGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        expect(body.data.id).toBe(advertiserBidMonitorMirrorId);
        expect(body.data.status).toBe(BidStatus.OK);
        expect(body.data.approved).toBe(BidApprove.ALLOWED);
      });
  });

  /**
   * Advertiser: Отправка плэйлиста на монитор Scaling
   */
  // test('Advertiser: PATCH /monitor/playlist (Отправка плэйлиста на монитор Scaling)', async () => {
  //   if (
  //     !advertiserToken ||
  //     !advertiserPlaylistId1 ||
  //     !monitorGroupScalingId
  //   ) {
  //     expect(false).toEqual(true);
  //   }

  //   const playlistToMonitor: MonitorsPlaylistAttachRequest = {
  //     playlistId: advertiserPlaylistId1,
  //     monitorIds: [monitorGroupScalingId],
  //     bid: {
  //       dateBefore: dayjs().add(1).toDate(),
  //       dateWhen: dayjs().subtract(1, 'day').toDate(),
  //       playlistChange: true,
  //     },
  //   };

  //   await request
  //     .patch(`${apiPath}/monitor/playlist`)
  //     .auth(advertiserToken, { type: 'bearer' })
  //     .send(playlistToMonitor)
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .expect(200)
  //     .then(({ body }: { body: BidsGetResponse }) => {
  //       expect(body.status).toBe(Status.Success);
  //       expect(body.data).toBeInstanceOf(Object);
  //       expect(body.count).toBe(1);
  //       expect(body.data[0].id).toBeDefined();
  //       advertiserBidMonitorScalingId = body.data[0].id;
  //     });
  // });

  /**
   * MonitorOwner: Утверждение заявки advertiserBidMonitorScalingId
   */
  // test('MonitorOwner: PATCH /bid/{advertiserBidMonitorScalingId} (Утверждение заявки)', async () => {
  //   if (!monitorOwnerToken || !advertiserBidMonitorScalingId) {
  //     expect(false).toEqual(true);
  //   }

  //   const bid: BidUpdateRequest = {
  //     approved: BidApprove.ALLOWED,
  //   };

  //   await request
  //     .patch(`${apiPath}/bid/${advertiserBidMonitorScalingId}`)
  //     .auth(monitorOwnerToken, { type: 'bearer' })
  //     .send(bid)
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .expect(200)
  //     .then(({ body }: { body: BidGetResponse }) => {
  //       expect(body.status).toBe(Status.Success);
  //       expect(body.data).toBeInstanceOf(Object);
  //       expect(body.data.id).toBe(advertiserBidMonitorScalingId);
  //     });
  // });

  /**
   * Monitor Single: авторизация
   */
  test('Monitor Single: POST /auth/monitor [Авторизация монитора Single]', async () => {
    if (!monitorSingleId || !monitorCodeSingle) {
      expect(false).toEqual(true);
      return;
    }

    const auth: AuthMonitorRequest = {
      code: monitorCodeSingle,
    };

    await request
      .post(`${apiPath}/auth/monitor`)
      .send(auth)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: AuthRefreshResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.payload).toBeInstanceOf(Object);
        expect(body.payload.token).toBeTruthy();
        expect(body.payload.refreshToken).toBeTruthy();
        expect(body.payload.type).toBeTruthy();
        monitorSingleToken = body.payload.token;
        monitorSingleRefreshToken = body.payload.refreshToken || '';
      });
  });

  /**
   * Advertiser: Получение списка файлов
   */
  test('Advertiser: POST /file (Получение списка файлов: advertiserVideoId.user === true)', async () => {
    if (!advertiserToken) {
      expect(false).toEqual(true);
      return;
    }

    await request
      .post(`${apiPath}/file`)
      .auth(advertiserToken, { type: 'bearer' })
      .send({})
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body }: { body: FilesGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeInstanceOf(Object);
        const filesAdv = body.data.filter(
          (files) => files.id === advertiserVideoId,
        );
        expect(filesAdv[0].used).toBeTruthy();
      });
  });

  /**
   *
   * Повышаем роли Advertiser до администратора и логинимся, и после этого удаляем все
   *
   */
  describe('Повышаем роли Advertiser до администратора и логинимся, и после этого удаляем все', () => {
    // return;

    /**
     * Administrator
     */
    test('Change user Role: Administrator (database access)', async () => {
      if (advertiserUser) {
        const userUpdate = await userService.update(advertiserUser, {
          role: UserRoleEnum.Administrator,
        });
        expect(userUpdate).toBeDefined();
        if (!userUpdate) {
          return;
        }
        expect(userUpdate.id).toBe(advertiserUserId);
        expect(userUpdate.role).toBe(UserRoleEnum.Administrator);
      } else {
        expect(false).toEqual(true);
        return;
      }
    });

    test('POST /auth/login (Повторная авторизация пользователя)', async () => {
      await request
        .post(`${apiPath}/auth/login`)
        .send(loginRequestAdvertiser)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: AuthResponse }) => {
          expect(body.payload?.type).toBe('bearer');
          expect(body.data?.id).toBe(advertiserUserId);
          expect(body.data?.role).toBe(UserRoleEnum.Administrator);
          expect(body.payload?.token).toBeDefined();
          expect(body.payload?.refreshToken).toBeDefined();
          expect((body.data as any).password).toBeUndefined();
          advertiserToken = body.payload?.token ?? '';
          advertiserRefreshToken = body.payload?.refreshToken ?? '';
        });
    });

    /**
     * Удаление файлов monitor-owner
     */
    test('DELETE /file/{monitorOwnerImageId} (Удаление файлов)', async () => {
      if (!monitorOwnerToken || !monitorOwnerImageId) {
        expect(false).toEqual(true);
        return;
      }

      const { body }: { body: SuccessResponse } = await request
        .delete(`${apiPath}/file/${monitorOwnerImageId}`)
        .auth(monitorOwnerToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(body.status).toBe(Status.Success);
    });

    /**
     * Удаление аккаунта пользователя monitor-owner (только администратор)
     */
    test(`/user/{monitorOwnerUserId} (Удаление пользователя monitor-owner)`, async () => {
      if (!monitorOwnerToken || !monitorOwnerUserId || !advertiserToken) {
        expect(false).toBe(true);
      }

      const url = `${apiPath}/user/${monitorOwnerUserId}`;
      await request
        .delete(url)
        .auth(advertiserToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ status: Status.Success });
    });

    /**
     * Удаление аккаунта пользователя accountant (только администратор)
     */
    test(`/user/{accountantUserId} (Удаление пользователя accountant)`, async () => {
      if (!accountantToken || !accountantUserId) {
        expect(false).toBe(true);
      }

      const url = `${apiPath}/user/${accountantUserId}`;
      await request
        .delete(url)
        .auth(advertiserToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ status: Status.Success });
    });

    /**
     * Удаление плэйлиста advertiser
     */
    test('DELETE /playlist/{advertiserPlaylistId1} (Удаление плэйлиста)', async () => {
      if (!advertiserToken || !advertiserPlaylistId1) {
        expect(false).toEqual(true);
        return;
      }

      const { body }: { body: SuccessResponse } = await request
        .delete(`${apiPath}/playlist/${advertiserPlaylistId1}`)
        .auth(advertiserToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(body.status).toBe(Status.Success);
    });

    /**
     * Получение информации о редакторах
     */
    test('Advertiser: GET /editor (Получение информации о редакторах)', async () => {
      if (!advertiserToken) {
        expect(false).toEqual(true);
        return;
      }

      await request
        .post(`${apiPath}/editor`)
        .auth(advertiserToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: EditorsGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeInstanceOf(Object);
          advertiserEditorAutoId = body.data;
        });
    });

    /**
     * Удаление редактора advertiser
     */
    test('DELETE /editor/{advertiserEditorAutoId} (Удаление редактора)', async () => {
      if (
        !advertiserToken ||
        !advertiserEditorAutoId ||
        advertiserEditorAutoId.length === 0
      ) {
        expect(false).toEqual(true);
        return;
      }

      for (const editor of advertiserEditorAutoId) {
        const { body }: { body: SuccessResponse } = await request
          .delete(`${apiPath}/editor/${editor.id}`)
          .auth(advertiserToken, { type: 'bearer' })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200);
        expect(body.status).toBe(Status.Success);
      }
    });

    /**
     * Удаление файлов advertiser
     */
    test('DELETE /file/{advertiserVideoId} (Удаление файлов)', async () => {
      if (!advertiserToken || !advertiserVideoId) {
        expect(false).toEqual(true);
        return;
      }

      const { body }: { body: SuccessResponse } = await request
        .delete(`${apiPath}/file/${advertiserVideoId}`)
        .auth(advertiserToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(body.status).toBe(Status.Success);
    });

    /**
     * Удаление пользователя advertiser
     */
    test(`/user/{advertiserUserId} (Удаление пользователя advertiser)`, async () => {
      if (!advertiserToken || !advertiserUserId) {
        expect(false).toBe(true);
      }

      const url = `${apiPath}/user/${advertiserUserId}`;
      await request
        .delete(url)
        .auth(advertiserToken, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ status: Status.Success });
    });
  });

  afterEach(() => {
    wsAdvertiser?.close();
    wsMonitorOwner?.close();
  });

  afterAll(() => {
    wsAdvertiser?.close();
    wsMonitorOwner?.close();
    app?.close();
  });
});
