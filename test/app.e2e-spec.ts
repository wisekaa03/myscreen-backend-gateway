/* eslint max-len:0 */
import { readFileSync } from 'node:fs';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpAdapterHost } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { WinstonModule } from 'nest-winston';
import superAgentRequest from 'supertest';
import { LoggerModule } from 'nestjs-pino';

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
  FileGetResponse,
  VerifyEmailRequest,
  ResetPasswordInvitationRequest,
  FilesGetRequest,
  AuthRefreshRequest,
} from '@/dto';
import { Status } from '@/enums';
import { generateMailToken } from '@/utils/mail-token';
import { ExceptionsFilter } from '@/exception/exceptions.filter';
import { UserRoleEnum } from '@/enums/role.enum';
import { UserEntity } from '@/database/user.entity';
import { UserExtEntity } from '@/database/user.view.entity';
import { UserService } from '@/database/user.service';
import { AppModule } from '@/app.module';
import { WsAdapter } from '@/websocket/ws-adapter';

type UserFileEntity = UserEntity & Partial<UserExtEntity>;

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  remove: async () => Promise.resolve([]),
  metadata: {
    columns: [],
    relations: [],
  },
}));

const registerRequest: RegisterRequest = {
  email: 'foo@bar.baz', // 'wisekaa03@gmail.com',
  password: 'Secret~123456',
  role: UserRoleEnum.Advertiser,
  name: 'John',
  surname: 'Steve',
  middleName: 'Doe',
  city: 'Krasnodar',
  country: 'RU',
  company: 'ACME corporation',
  phoneNumber: '+78002000000',
};

const loginRequest: LoginRequest = {
  email: 'foo@bar.baz',
  password: 'Secret~123456',
};

const updateUser: UserUpdateRequest = {
  email: 'foo@bar.baz', // 'wisekaa03@gmail.com',
  role: UserRoleEnum.Advertiser,
  name: 'John',
  surname: 'Steve',
  middleName: 'Doe',
  city: 'Krasnodar',
  country: 'RU',
  company: 'ACME corporation',
  phoneNumber: '+78002000000',
  companyActualAddress: '',
  companyBIC: '',
  companyBank: '',
  companyCorrespondentAccount: '',
  companyEmail: '',
  companyFax: '',
  companyLegalAddress: '',
  companyPSRN: '',
  companyPaymentAccount: '',
  companyPhone: '',
  companyRRC: '',
  companyRepresentative: '',
  companyTIN: '',
  disabled: false,
  isDemoUser: false,
  verified: true,
  countUsedSpace: undefined,
  wallet: undefined,
};

describe('Backend API (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;
  let request: superAgentRequest.SuperTest<superAgentRequest.Test>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: LoggerModule,
          useClass: mockRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    const httpAdaper = app.get(HttpAdapterHost);

    // const configService = app.get(ConfigService);
    // app.useLogger(app.get(Logger));
    app.useLogger(false);

    app.useGlobalFilters(new ExceptionsFilter(httpAdaper.httpAdapter));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        skipUndefinedProperties: true,
        stopAtFirstError: true,
      }),
    );
    app.useWebSocketAdapter(new WsAdapter(app));
    userService = app.get<UserService>(UserService);

    await app.init();

    request = superAgentRequest(app.getHttpServer());
  });

  let user: UserFileEntity | null;
  let token = '';
  let refreshToken: string | undefined = '';
  let userId = '';
  let parentFolderId = '';
  let parentFolderId2 = '';
  let folderId1 = '';
  let folderId2 = '';
  let folderId3 = '';
  let mediaId1 = '';

  /**
   *
   * Авторизация /auth
   *
   */
  describe('Авторизация /auth', () => {
    /**
     * Регистрация пользователя
     */
    test('POST /auth/register (Регистрация пользователя)', async () => {
      await request
        .post('/auth/register')
        .send(registerRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: UserGetResponse }) => {
          expect(body.data.id).toBeDefined();
          expect(body.data.password).toBeUndefined();
          if (body.data.id) {
            userId = body.data.id;
          }
        });
    });

    test('POST /auth/login [email пока не подтвержден] (Авторизация пользователя)', async () => {
      await request
        .post('/auth/login')
        .send(loginRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    /**
     * Регистрация пользователя опять с теми же самыми параметрами
     */
    test('POST /auth/register [опять, с теми же самыми параметрами] (Регистрация пользователя)', async () => {
      await request
        .post('/auth/register')
        .send(registerRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(412);
    });

    /**
     * Регистрация пользователя опять
     */
    test('POST /auth/register [email изменен, пароль изменен] (Регистрация пользователя)', async () => {
      await request
        .post('/auth/register')
        .send({ ...registerRequest, email: '', password: '' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Подтвердить email пользователя
     */
    test('POST /auth/email-verify (Подтвердить email пользователя)', async () => {
      user = await userService.findById(userId);
      if (user) {
        const verify: VerifyEmailRequest = {
          verify: generateMailToken(user.email, user.emailConfirmKey ?? '-'),
        };

        await request
          .post('/auth/email-verify')
          .send(verify)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(({ body }: { body: SuccessResponse }) => {
            expect(body.status).toBe(Status.Success);
          });
      }

      expect(false).toEqual(true);
    });

    /**
     * Авторизация пользователя с пустым паролем
     */
    test('POST /auth/login [с пустым паролем] (Авторизация пользователя)', async () => {
      await request
        .post('/auth/login')
        .send({ email: 'foo@bar.baz' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    test('POST /auth/login [с пустым email] (Авторизация пользователя)', async () => {
      await request
        .post('/auth/login')
        .send({ password: 'Secret~123456' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    test('POST /auth/login [с неправильным паролем] (Авторизация пользователя)', async () => {
      await request
        .post('/auth/login')
        .send({ ...loginRequest, password: 'sss' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    test('POST /auth/login [с неправильным email] (Авторизация пользователя)', async () => {
      await request
        .post('/auth/login')
        .send({ ...loginRequest, email: 'sss' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    /**
     * Авторизация пользователя [success]
     */
    test('POST /auth/login [success] (Авторизация пользователя)', async () => {
      await request
        .post('/auth/login')
        .send(loginRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: AuthResponse }) => {
          expect(body.payload?.type).toBe('bearer');
          expect(body.data?.id).toBe(userId);
          expect(body.payload?.token).toBeDefined();
          expect(body.payload?.refreshToken).toBeDefined();
          expect((body.data as any).password).toBeUndefined();
          token = body.payload?.token ?? '';
          refreshToken = body.payload?.refreshToken ?? '';
        });
    });

    /**
     * Изменение аккаунта пользователя
     */
    test('PATCH /auth (Изменение аккаунта пользователя)', async () => {
      await request
        .patch('/auth')
        .auth(token, { type: 'bearer' })
        .send(updateUser)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: UserGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.id).toBe(userId);
          expect((body.data as any).password).toBeUndefined();
        });
    });
    // TODO: проверить изменение пользователя

    /**
     * Проверяет, авторизован ли пользователь и выдает о пользователе полную информацию
     */
    test('GET /auth (Проверяет, авторизован ли пользователь и выдает о пользователе полную информацию)', async () => {
      await request
        .get('/auth')
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: UserGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.id).toBe(userId);
          expect(body.data.password).toBeUndefined();
        });
    });

    /**
     * Обновление токена [неправильный refresh_token]
     */
    test('POST /auth/refresh [неправильный refresh_token] (Обновление токена)', async () => {
      const verify: VerifyEmailRequest = { verify: 'фывфвафавыаы' };
      await request
        .post('/auth/refresh')
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
        .post('/auth/refresh')
        .send({})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    test('POST /auth/refresh [success] (Обновление токена)', async () => {
      const verify: AuthRefreshRequest = { refreshToken: refreshToken ?? '' };
      const content = request.post('/auth/refresh').send(verify);

      await content
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: AuthRefreshResponse }) => {
          expect(body.payload.token).toBeDefined();
          token = body.payload.token ?? undefined;
          refreshToken = body.payload.refreshToken;
        });
    });

    /**
     * Отправить на почту пользователю разрешение на смену пароля [отсутствие email]
     */
    test('POST /auth/reset-password [отсутствие email] (Отправить на почту пользователю разрешение на смену пароля)', async () => {
      const body = request.post('/auth/reset-password').send({});

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
        email: user?.email ?? '',
      };

      await request
        .post('/auth/reset-password')
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
        .patch('/auth/disable')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    /**
     * Скрытие аккаунта пользователя
     */
    test('PATCH /auth/disable [success] (Скрытие аккаунта пользователя)', async () => {
      await request
        .patch('/auth/disable')
        .auth(token, { type: 'bearer' })
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
      if (user) {
        const userUpdate = await userService.update(user.id, {
          disabled: false,
        });
        expect(userUpdate).toBe(true);
        if (!userUpdate) {
          return;
        }
        expect(userUpdate.id).toBe(userId);
      }
      expect(false).toEqual(true);
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
        .post('/folder')
        .auth(token, { type: 'bearer' })
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
        .put('/folder')
        .auth(token, { type: 'bearer' })
        .send({ name: 'bar' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: FolderGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.name).toBe('bar');
          // expect(body.data.parentFolderId).toBe(null);
          // expect(body.data.userId).toBe(userId);
          expect((body.data as any)?.user?.password).toBeUndefined();
          parentFolderId = body.data.id;
        });
    });

    // test('PUT /folder [name: "```"] [unsuccess] (Создание новой папки)', async () =>
    //   request
    //     .put('/folder')
    //     .auth(token, { type: 'bearer' })
    //     .send({ name: '```' })
    //     .set('Accept', 'application/json')
    //     .expect('Content-Type', /json/)
    //     .expect(400));

    test('PUT /folder [name: "baz"] (Создание новой папки)', async () => {
      await request
        .put('/folder')
        .auth(token, { type: 'bearer' })
        .send({ name: 'baz' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: FolderGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.name).toBe('baz');
          // expect(body.data.parentFolderId).toBe(null);
          // expect(body.data.userId).toBe(userId);
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
        .put('/folder')
        .auth(token, { type: 'bearer' })
        .send({ name: 'foo', parentFolderId })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: FolderGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.name).toBe('foo');
          expect(body.data.parentFolderId).toBe(parentFolderId);
          // expect(body.data.userId).toBe(userId);
          expect((body.data as any)?.user?.password).toBeUndefined();
          folderId1 = body.data.id;
        });
    });

    /**
     * Создание новой под-папки
     */
    test('PUT /folder [name: "baz", parentFolderId] (Создание новой под-папки)', async () => {
      await request
        .put('/folder')
        .auth(token, { type: 'bearer' })
        .send({ name: 'baz', parentFolderId: parentFolderId2 })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: FolderGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.name).toBe('baz');
          expect(body.data.parentFolderId).toBe(parentFolderId2);
          // expect(body.data.userId).toBe(userId);
          expect((body.data as any)?.user?.password).toBeUndefined();
          folderId2 = body.data.id;
        });
    });

    /**
     * Получение списка папок [{ where: { id: '' }, scope: { limit: 0 } }]
     */
    test("POST /folder [{ where: { id: '' }, scope: { limit: 0 } }] (Получение списка папок)", async () => {
      if (!token) {
        expect(false).toEqual(true);
      }

      await request
        .post('/folder')
        .auth(token, { type: 'bearer' })
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
      if (!token) {
        expect(false).toEqual(true);
      }

      const content = request
        .post('/folder')
        .auth(token, { type: 'bearer' })
        .send({ where: {}, scope: {} })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      await content.then(({ body }: { body: FoldersGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.data).toBeDefined();
        expect((body.data as any)?.[0]?.user?.password).toBeUndefined();
      });
    });

    /**
     * Изменение информации о папке
     */
    test('PATCH /folder/{folderId} [success] (Изменение информации о папке)', async () => {
      if (!token || !folderId2) {
        expect(false).toEqual(true);
      }

      await request
        .patch(`/folder/${folderId2}`)
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send({
          name: 'bar2',
        })
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
     * Изменение информации о папке [неуспешно]
     */
    test('PATCH /folder/{folderId} [unsuccess] (Изменение информации о папке)', async () => {
      if (!token || !folderId2) {
        expect(false).toEqual(true);
      }

      await request
        .patch(`/folder/${folderId2}`)
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send({
          name: 'bar2',
          user: {},
        })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    /**
     * Получение информации о папке [успешно]
     */
    test('GET /folder/{folderId} [success] (Получение информации о папке)', async () => {
      if (!token || !folderId2) {
        expect(false).toEqual(true);
      }

      await request
        .get(`/folder/${folderId2}`)
        .auth(token, { type: 'bearer' })
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
      if (!token || !folderId2) {
        expect(false).toEqual(true);
      }

      await request
        .delete(`/folder/${folderId2}`)
        .auth(token, { type: 'bearer' })
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
      if (!token) {
        expect(false).toEqual(true);
      }

      await request
        .post('/file')
        .auth(token, { type: 'bearer' })
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
      if (!token || !folderId1) {
        expect(false).toEqual(true);
      }

      const files: FilesGetRequest = {
        where: { folderId: folderId1 },
        scope: {},
      };

      await request
        .post('/file')
        .auth(token, { type: 'bearer' })
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
      if (!token || !folderId1) {
        expect(false).toEqual(true);
      }

      await request
        .put('/file')
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .field({
          param: `{ "folderId": "${folderId1}", "category": "media" }`,
        })
        .attach('files', `${__dirname}/testing.png`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: FilesUploadResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data[0].id).toBeDefined();
          mediaId1 = body.data[0].id;
          expect(body.data[0]?.user?.password).toBeUndefined();
        });
    });

    /**
     * Изменение файлов
     */
    test('PATCH /file [success] (Изменение файлов)', async () => {
      if (!token || !folderId2) {
        expect(false).toEqual(true);
      }

      await request
        .patch(`/file/${mediaId1}`)
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send({ folderId: folderId3 })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: FileGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data.id).toBeDefined();
          mediaId1 = body.data.id;
          expect(body.data.user?.password).toBeUndefined();
        });
    });

    /**
     * Скачивание медиа [success]
     */
    test('GET /file/{mediaId} [success] (Скачивание медиа)', async () => {
      if (!token || !mediaId1) {
        expect(false).toEqual(true);
      }

      await request
        .get(`/file/${mediaId1}`)
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect(200)
        .then(({ body }: { body: unknown }) => {
          expect(body).toBeDefined();
          const file = readFileSync(`${__dirname}/testing.png`);
          expect(body).toStrictEqual(file);
        });
    });

    /**
     * Скачивание предпросмотра [success]
     */
    test('GET /file/{mediaId}/preview [success] (Скачивание предпросмотра)', async () => {
      if (!token || !mediaId1) {
        expect(false).toEqual(true);
      }

      await request
        .get(`/file/${mediaId1}/preview`)
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect(200)
        .then(({ body }: { body: unknown }) => {
          expect(body).toBeDefined();
        });
    });

    /**
     * Удаление файлов [success]
     */
    test('DELETE /file/{mediaId} [success] (Удаление файлов)', async () => {
      if (!token || !mediaId1) {
        expect(false).toEqual(true);
      }

      await request
        .delete(`/file/${mediaId1}`)
        .auth(token, { type: 'bearer' })
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
   * Повышаем роли до администратора и проверяем /user, и после этого удаляем
   *
   */
  describe('Повышаем роли до администратора и проверяем /user, и после этого удаляем', () => {
    /**
     * Administrator
     */
    test('Change user Role: Administrator (database access)', async () => {
      if (user) {
        const userUpdate = await userService.update(user.id, {
          role: UserRoleEnum.Administrator,
        });
        expect(userUpdate).toBeDefined();
        if (!userUpdate) {
          return;
        }
        expect(userUpdate.id).toBe(userId);
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
        .post('/auth/login')
        .send(loginRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: AuthResponse }) => {
          expect(body.payload?.type).toBe('bearer');
          expect(body.data?.id).toBe(userId);
          expect(body.payload?.token).toBeDefined();
          expect(body.payload?.refreshToken).toBeDefined();
          expect((body.data as any).password).toBeUndefined();
          token = body.payload?.token ?? '';
          refreshToken = body.payload?.refreshToken ?? '';
        });
    });

    /**
     * Удаление аккаунта пользователя (только администратор)
     */
    test('/user/{userId} (Удаление аккаунта пользователя, только администратор)', async () => {
      if (!token || !userId) {
        expect(false).toBe(true);
      }

      const url = `/user/${userId}`;
      await request
        .delete(url)
        .auth(token, { type: 'bearer' })
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
