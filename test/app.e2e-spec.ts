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
} from '@/dto';
import { UserRoleEnum } from '@/database/enums/role.enum';
import { UserService } from '@/database/user.service';
import { AppModule } from '@/app.module';
import { UserEntity } from '../src/database/user.entity';
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
      .then(({ body }: { body: AuthResponse }) => {
        token = body.payload?.token ?? '';
        userId = body.data.id;
      }));

  test('POST /auth/login [email пока не подтвержден] (Авторизация пользователя)', async () =>
    request
      .post('/auth/login')
      .send(loginRequest)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(401));

  test('POST /auth/register [опять, с теми же самыми параметрами] (Регистрация пользователя)', async () =>
    request
      .post('/auth/register')
      .send(registerRequest)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(412));

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
        .expect(201);
    }

    return expect(false).toEqual(true);
  });

  /**
   * Авторизация пользователя
   */
  test('POST /auth/login [success] (Авторизация пользователя)', async () =>
    request
      .post('/auth/login')
      .send(loginRequest)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)
      .then(({ body }: { body: AuthResponse }) => {
        token = body.payload?.token ?? '';
        userId = body.data.id;
      }));

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
   * Изменение аккаунта пользователя
   */
  test('PUT /auth (Изменение аккаунта пользователя)', async () =>
    request
      .put('/auth')
      .auth(token, { type: 'bearer' })
      .send(updateUser)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200));

  // TODO: GET /auth - Проверяет, авторизован ли пользователь и выдает о пользователе полную информацию
  // TODO: POST /auth/refresh - Обновление токена
  // TODO: POST /auth/reset-password - Отправить на почту пользователю разрешение на смену пароля
  // TODO: POST /auth/reset-password-verify - Меняет пароль пользователя по приглашению из почты
  // TODO: DELETE /auth/disable - Скрытие аккаунта пользователя

  // TODO: GET /folder - Получение списка папок
  // TODO: POST /folder/create - Создание новой папки
  // TODO: GET /folder/{folderId} - Получение информации о папке
  // TODO: PUT /folder/{folderId} - Изменение информации о папке
  // TODO: DELETE /folder/{folderId} - Удаление папки

  /**
   * Administrator
   */
  test('Change user Disabled: False and Role: Administrator (database access)', async () => {
    if (user) {
      await userService.update(user, {
        disabled: false,
        role: UserRoleEnum.Administrator,
      });
      return expect(true).toEqual(true);
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
