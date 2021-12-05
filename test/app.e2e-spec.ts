import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import superAgentRequest from 'supertest';

import { AppModule } from '../src/app.module';
import {
  AuthResponse,
  RegisterRequest,
  Status,
  LoginRequest,
  UserUpdateRequest,
} from '@/dto';
import { UserRoleEnum } from '@/database/enums/role.enum';
import { UserService } from '@/database/user.service';

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

  let token = '';
  let userId = '';

  // test('/auth/register (POST)', async () =>
  //   request
  //     .post('/auth/register')
  //     .send(registerRequest)
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .expect(201)
  //     .then(({ body }: { body: AuthResponse }) => {
  //       token = body.payload.token;
  //       userId = body.data.id;
  //     }));

  test('userService.createTest', async () => {
    await userService.createTest({
      ...registerRequest,
      verified: true,
      role: UserRoleEnum.Administrator,
    });
    expect(true).toEqual(true);
  });

  test('/auth/login (POST)', async () =>
    request
      .post('/auth/login')
      .send(loginRequest)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)
      .then(({ body }: { body: AuthResponse }) => {
        token = body.payload.token;
        userId = body.data.id;
      }));

  test('/auth/login with failed password (POST)', async () =>
    request
      .post('/auth/login')
      .send({ email: 'foo@bar.baz' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(500));

  test('/auth/login with failed email (POST)', async () =>
    request
      .post('/auth/login')
      .send({ password: 'Secret~123456' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(401));

  test('/auth/update (POST)', async () =>
    request
      .post('/auth/update')
      .auth(token, { type: 'bearer' })
      .send(updateUser)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201));

  test('Change user role: Administrator', async () => {
    const user = await userService.findById(userId);
    await userService.update(user, { role: UserRoleEnum.Administrator });
    expect(true).toEqual(true);
  });

  test('/user/delete/{userId} (DELETE)', async () =>
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
