/* eslint max-len:0 */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpAdapterHost } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { WinstonModule } from 'nest-winston';
import superAgentRequest from 'supertest';

import {
  AuthResponse,
  RegisterRequest,
  Status,
  LoginRequest,
  UserUpdateRequest,
  UserResponse,
  SuccessResponse,
  RefreshTokenResponse,
  FoldersGetResponse,
  FolderUpdateResponse,
  MediaGetFilesResponse,
  MediaUploadFilesResponse,
} from '@/dto';
import { UserRoleEnum } from '@/database/enums/role.enum';
import { UserEntity } from '@/database/user.entity';
import { UserService } from '@/database/user.service';
import { AppModule } from '@/app.module';
import { generateMailToken } from '@/shared/mail-token';
import { ExceptionsFilter } from '@/exception/exceptions.filter';
import { winstonOptions } from '@/shared/logger.options';

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
};

describe('Backend API (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;
  let request: superAgentRequest.SuperTest<superAgentRequest.Test>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const httpAdaper = app.get(HttpAdapterHost);

    // const configService = app.get(ConfigService);
    // const logger = WinstonModule.createLogger(winstonOptions(configService));
    // app.useLogger(logger);
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

    await app.init();

    userService = app.get<UserService>(UserService);
    request = superAgentRequest(app.getHttpServer());
  });

  let user: UserEntity | undefined;
  let verifyToken: string;
  let token = '';
  let refreshToken = '';
  let userId = '';
  let parentFolderId = '';
  let parentFolderId2 = '';
  let folderId1 = '';
  let folderId2 = '';
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
    test('POST /auth/register (Регистрация пользователя)', async () =>
      request
        .post('/auth/register')
        .send(registerRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: UserResponse }) => {
          expect(body.data.id).toBeDefined();
          expect((body.data as any).password).toBeUndefined();
          if (body.data.id) {
            userId = body.data.id;
          }
        }));

    test('POST /auth/login [email пока не подтвержден] (Авторизация пользователя)', async () =>
      request
        .post('/auth/login')
        .send(loginRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401));

    /**
     * Регистрация пользователя опять с теми же самыми параметрами
     */
    test('POST /auth/register [опять, с теми же самыми параметрами] (Регистрация пользователя)', async () =>
      request
        .post('/auth/register')
        .send(registerRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(412));

    /**
     * Регистрация пользователя опять
     */
    test('POST /auth/register [email изменен, пароль изменен] (Регистрация пользователя)', async () =>
      request
        .post('/auth/register')
        .send({ ...registerRequest, email: '', password: '' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400));

    /**
     * Подтвердить email пользователя
     */
    test('POST /auth/email-verify (Подтвердить email пользователя)', async () => {
      user = await userService.findById(userId);
      if (user) {
        verifyToken = generateMailToken(
          user.email,
          user.emailConfirmKey ?? '-',
        );

        return request
          .post('/auth/email-verify')
          .send({ verify_email: verifyToken })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(({ body }: { body: SuccessResponse }) => {
            expect(body.status).toBe(Status.Success);
          });
      }

      return expect(false).toEqual(true);
    });

    /**
     * Авторизация пользователя с пустым паролем
     */
    test('POST /auth/login [с пустым паролем] (Авторизация пользователя)', async () =>
      request
        .post('/auth/login')
        .send({ email: 'foo@bar.baz' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401));

    test('POST /auth/login [с пустым email] (Авторизация пользователя)', async () =>
      request
        .post('/auth/login')
        .send({ password: 'Secret~123456' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401));

    test('POST /auth/login [с неправильным паролем] (Авторизация пользователя)', async () =>
      request
        .post('/auth/login')
        .send({ ...loginRequest, password: 'sss' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401));

    test('POST /auth/login [с неправильным email] (Авторизация пользователя)', async () =>
      request
        .post('/auth/login')
        .send({ ...loginRequest, email: 'sss' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401));

    /**
     * Авторизация пользователя [success]
     */
    test('POST /auth/login [success] (Авторизация пользователя)', async () =>
      request
        .post('/auth/login')
        .send(loginRequest)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: AuthResponse }) => {
          expect(body.payload?.type).toBe('bearer');
          expect(body.data?.id).toBe(userId);
          expect(body.payload?.token).toBeDefined();
          expect(body.payload?.refresh_token).toBeDefined();
          expect((body.data as any).password).toBeUndefined();
          token = body.payload?.token ?? '';
          refreshToken = body.payload?.refresh_token ?? '';
        }));

    /**
     * Изменение аккаунта пользователя
     */
    test('PATCH /auth (Изменение аккаунта пользователя)', async () =>
      request
        .patch('/auth')
        .auth(token, { type: 'bearer' })
        .send(updateUser)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: UserResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.id).toBe(userId);
          expect((body.data as any).password).toBeUndefined();
        }));
    // TODO: проверить изменение пользователя

    /**
     * Проверяет, авторизован ли пользователь и выдает о пользователе полную информацию
     */
    test('GET /auth (Проверяет, авторизован ли пользователь и выдает о пользователе полную информацию)', async () =>
      request
        .get('/auth')
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: UserResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.id).toBe(userId);
          expect((body.data as any).password).toBeUndefined();
        }));

    /**
     * Обновление токена [неправильный refresh_token]
     */
    test('POST /auth/refresh [неправильный refresh_token] (Обновление токена)', async () =>
      request
        .post('/auth/refresh')
        .send({ refresh_token: 'фывфвафавыаы' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(403));

    /**
     * Обновление токена [отсутствие refresh_token]
     */
    test('POST /auth/refresh [отсутствие refresh_token] (Обновление токена)', async () =>
      request
        .post('/auth/refresh')
        .send({})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401));

    test('POST /auth/refresh [success] (Обновление токена)', async () =>
      request
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: RefreshTokenResponse }) => {
          expect(body.token).toBeDefined();
          token = body.token ?? '';
        }));

    /**
     * Отправить на почту пользователю разрешение на смену пароля [отсутствие email]
     */
    test('POST /auth/reset-password [отсутствие email] (Отправить на почту пользователю разрешение на смену пароля)', async () =>
      request
        .post('/auth/reset-password')
        .send({})
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401));

    /**
     * Отправить на почту пользователю разрешение на смену пароля [succcess]
     */
    test('POST /auth/reset-password [success] (Отправить на почту пользователю разрешение на смену пароля)', async () =>
      request
        .post('/auth/reset-password')
        .send({ email: user?.email })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: SuccessResponse }) => {
          expect(body.status).toBe(Status.Success);
        }));

    // TODO: POST /auth/reset-password-verify - Меняет пароль пользователя по приглашению из почты

    /**
     * Скрытие аккаунта пользователя - неавторизован
     */
    test('PATCH /auth/disable [неавторизован] (Скрытие аккаунта пользователя)', async () =>
      request
        .patch('/auth/disable')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(401));

    /**
     * Скрытие аккаунта пользователя
     */
    test('PATCH /auth/disable [success] (Скрытие аккаунта пользователя)', async () =>
      request
        .patch('/auth/disable')
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: SuccessResponse }) => {
          expect(body.status).toBe(Status.Success);
        }));

    /**
     * Изменение через базу disabled: false
     */
    test('Change user Disabled: False (database access)', async () => {
      if (user) {
        const userUpdate = await userService.update(user, {
          disabled: false,
        });
        return expect(userUpdate.id).toBe(userId);
      }
      return expect(false).toEqual(true);
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
    test('POST /folder [ scope: { limit: 0 } }] (Получение списка папок)', async () =>
      request
        .post('/folder')
        .auth(token, { type: 'bearer' })
        .send({ where: {}, scope: { limit: 0 } })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400));

    /**
     * Создание новой папки
     */
    test('POST /folder/create [name: "bar"] (Создание новой папки)', async () =>
      request
        .post('/folder/create')
        .auth(token, { type: 'bearer' })
        .send({ name: 'bar' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: FolderUpdateResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.name).toBe('bar');
          expect(body.data.parentFolderId).toBe(null);
          expect(body.data.userId).toBe(userId);
          expect((body.data as any)?.user?.password).toBeUndefined();
          parentFolderId = body.data.id;
        }));

    test('POST /folder/create [name: "```"] [unsuccess] (Создание новой папки)', async () =>
      request
        .post('/folder/create')
        .auth(token, { type: 'bearer' })
        .send({ name: '```' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400));

    test('POST /folder/create [name: "foo"] (Создание новой папки)', async () =>
      request
        .post('/folder/create')
        .auth(token, { type: 'bearer' })
        .send({ name: 'foo' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: FolderUpdateResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.name).toBe('foo');
          expect(body.data.parentFolderId).toBe(null);
          expect(body.data.userId).toBe(userId);
          expect((body.data as any)?.user?.password).toBeUndefined();
          parentFolderId2 = body.data.id;
        }));

    /**
     * Создание новой под-папки
     */
    test('POST /folder/create [name: "foo", parentFolderId] (Создание новой под-папки)', async () =>
      request
        .post('/folder/create')
        .auth(token, { type: 'bearer' })
        .send({ name: 'foo', parentFolderId })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: FolderUpdateResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.name).toBe('foo');
          expect(body.data.parentFolderId).toBe(parentFolderId);
          expect(body.data.userId).toBe(userId);
          expect((body.data as any)?.user?.password).toBeUndefined();
          folderId1 = body.data.id;
        }));

    /**
     * Создание новой под-папки
     */
    test('POST /folder/create [name: "baz", parentFolderId] (Создание новой под-папки)', async () =>
      request
        .post('/folder/create')
        .auth(token, { type: 'bearer' })
        .send({ name: 'baz', parentFolderId: parentFolderId2 })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
        .then(({ body }: { body: FolderUpdateResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data.name).toBe('baz');
          expect(body.data.parentFolderId).toBe(parentFolderId2);
          expect(body.data.userId).toBe(userId);
          expect((body.data as any)?.user?.password).toBeUndefined();
          folderId2 = body.data.id;
        }));

    /**
     * Получение списка папок [{ where: { id: '' }, scope: { limit: 0 } }]
     */
    test("POST /folder [{ where: { id: '' }, scope: { limit: 0 } }] (Получение списка папок)", async () => {
      request
        .post('/folder')
        .auth(token, { type: 'bearer' })
        .send({
          where: { id: '' },
          scope: { limit: 0 },
        })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500);
    });

    /**
     * Получение списка папок
     */
    test('POST /folder [success] (Получение списка папок)', async () =>
      request
        .post('/folder')
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: FoldersGetResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect((body.data as any)?.[0]?.user?.password).toBeUndefined();
        }));

    /**
     * Изменение информации о папке
     */
    test('PATCH /folder/{folderId} [success] (Изменение информации о папке)', async () =>
      request
        .patch(`/folder/${folderId2}`)
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send({
          name: 'bar2',
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: FolderUpdateResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data.id).toBe(folderId2);
          expect(body.data.name).toBe('bar2');
          expect((body.data as any)?.user?.password).toBeUndefined();
        }));

    /**
     * Изменение информации о папке [неуспешно]
     */
    test('PATCH /folder/{folderId} [unsuccess] (Изменение информации о папке)', async () =>
      request
        .patch(`/folder/${folderId2}`)
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .send({
          name: 'bar2',
          user: {},
        })
        .expect('Content-Type', /json/)
        .expect(400));

    /**
     * Получение информации о папке [успешно]
     */
    test('GET /folder/{folderId} [success] (Получение информации о папке)', async () =>
      request
        .get(`/folder/${folderId2}`)
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: FolderUpdateResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data.id).toBe(folderId2);
          expect(body.data.name).toBe('bar2');
          expect((body.data as any)?.user?.password).toBeUndefined();
        }));

    /**
     * Удаление папки [успешно]
     */
    test('DELETE /folder/{folderId} [success] (Удаление папки)', async () =>
      request
        .delete(`/folder/${folderId2}`)
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: SuccessResponse }) => {
          expect(body.status).toBe(Status.Success);
        }));
  });

  /**
   *
   * Медиа
   *
   */
  describe('Медиа /media', () => {
    /**
     * Получение списка файлов (неуспешно)
     */
    test('POST /media [unsuccess] (Получение списка файлов)', async () =>
      request
        .post('/media')
        .auth(token, { type: 'bearer' })
        .send({ where: {} })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400));

    /**
     * Получение списка файлов
     */
    test('POST /media (Получение списка файлов)', async () =>
      request
        .post('/media')
        .auth(token, { type: 'bearer' })
        .send({ where: { folderId: folderId1 } })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: MediaGetFilesResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data[0]?.user?.password).toBeUndefined();
        }));

    /**
     * Загрузка файлов [success]
     */
    test('PUT /media [success] (Загрузка файлов)', async () =>
      request
        .put('/media')
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .field('folderId', folderId1)
        .attach('files', `${__dirname}/testing.png`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: MediaUploadFilesResponse }) => {
          expect(body.status).toBe(Status.Success);
          expect(body.data).toBeDefined();
          expect(body.data[0].id).toBeDefined();
          mediaId1 = body.data[0].id;
          expect(body.data[0]?.user?.password).toBeUndefined();
        }));

    /**
     * Скачивание медиа [success]
     */
    test('GET /media/file/{mediaId} [success] (Скачивание медиа)', async () =>
      request
        .get(`/media/file/${mediaId1}`)
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', 'image/png')
        .expect(200)
        .then(({ body }: { body: any }) => {
          expect(body).toBeDefined();
        }));

    /**
     * Удаление файлов [success]
     */
    test('DELETE /media/{mediaId} [success] (Удаление файлов)', async () =>
      request
        .delete(`/media/${mediaId1}`)
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body }: { body: SuccessResponse }) => {
          expect(body.status).toBe(Status.Success);
        }));
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
        const userUpdate = await userService.update(user, {
          role: UserRoleEnum.Administrator,
        });
        return expect(userUpdate.id).toBe(userId);
      }
      return expect(false).toEqual(true);
    });

    // TODO: GET /user - Получение информации о пользователях (только администратор)
    // TODO: GET /user/{userId} - Получение информации о пользователе (только администратор)
    // TODO: POST /user/{userId} - Изменение информации о пользователе (только администратор)
    // TODO: DELETE /user/disable/{userId} - Скрытие аккаунта пользователя (только администратор)
    // TODO: POST /user/enable/{userId} - Открытие аккаунта пользователя (только администратор)

    /**
     * Удаление аккаунта пользователя (только администратор)
     */
    test('/user/delete/{userId} (Удаление аккаунта пользователя, только администратор)', async () =>
      request
        .delete(`/user/delete/${userId}`)
        .auth(token, { type: 'bearer' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ status: Status.Success }));
  });

  afterAll(async () => {
    await app.close();
  });
});
