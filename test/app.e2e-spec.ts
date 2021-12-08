/* eslint max-len:0 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
} from '@/dto';
import { UserRoleEnum } from '@/database/enums/role.enum';
import { UserEntity } from '@/database/user.entity';
import { UserService } from '@/database/user.service';
import { AppModule } from '@/app.module';
import { generateMailToken } from '@/shared/mail-token';

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
    await app.init();

    userService = app.get<UserService>(UserService);
    request = superAgentRequest(app.getHttpServer());
  });

  let user: UserEntity | undefined;
  let verifyToken: string;
  let token = '';
  let refreshToken = '';
  let userId = '';

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
        expect(body.data?.id).toBeDefined();
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
      verifyToken = generateMailToken(user.email, user.emailConfirmKey ?? '-');

      return request
        .post('/auth/email-verify')
        .send({ verify_email: verifyToken })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(201)
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
      .expect(201)
      .then(({ body }: { body: AuthResponse }) => {
        expect(body.payload?.type).toBe('bearer');
        expect(body.data?.id).toBe(userId);
        expect(body.payload?.token).toBeDefined();
        expect(body.payload?.refresh_token).toBeDefined();
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
      .expect(201)
      .then(({ body }: { body: RefreshTokenResponse }) => {
        expect(body.token).toBeDefined();
        token = body.token ?? '';
      }));

  // TODO: POST /auth/reset-password - Отправить на почту пользователю разрешение на смену пароля
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
      .expect(201)
      .then(({ body }: { body: FoldersGetResponse }) => {
        expect(body.status).toBe(Status.Success);
        expect(body.count).toBe(0);
      }));

  // TODO: POST /folder/create - Создание новой папки

  /**
   * Получение списка папок [{ where: { id: '' }, scope: { limit: 0 } }]
   */
  test("POST /folder [{ where: { id: '' }, scope: { limit: 0 } }] (Получение списка папок)", async () =>
    request
      .post('/folder')
      .auth(token, { type: 'bearer' })
      .send({ where: { id: '' }, scope: { limit: 0 } })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(500));

  /**
   * Получение списка папок
   */
  test('POST /folder [success] (Получение списка папок)', async () =>
    request
      .post('/folder')
      .auth(token, { type: 'bearer' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)
      .then(({ body }: { body: FoldersGetResponse }) => {
        expect(body.status).toBe(Status.Success);
      }));

  // TODO: PATCH /folder/{folderId} - Изменение информации о папке
  // TODO: GET /folder/{folderId} - Получение информации о папке
  // TODO: DELETE /folder/{folderId} - Удаление папки

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

  afterAll(async () => {
    await app.close();
  });
});
