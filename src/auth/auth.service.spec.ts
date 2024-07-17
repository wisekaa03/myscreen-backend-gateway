import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { getRepositoryToken } from '@nestjs/typeorm';

import { MAIL_SERVICE } from '@/constants';
import { UserPlanEnum, UserRoleEnum } from '@/enums';
import { UserService } from '@/database/user.service';
import { RefreshTokenService } from '@/database/refreshtoken.service';
import { UserEntity } from '@/database/user.entity';
import { UserResponse } from '@/database/user-response.entity';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { FileService } from '@/database/file.service';
import { FileEntity } from '@/database/file.entity';
import { FolderEntity } from '@/database/folder.entity';
import { Observable } from 'rxjs';

UserService.validateCredentials = () => true;

describe(AuthService.name, () => {
  let service: AuthService;
  let userService: UserService;

  const email = 'foo@bar.baz';
  const password = 'Secret~123456';
  const token = 'token';

  let user: UserEntity;
  let userResponse: UserResponse;

  const mockRepository = jest.fn(() => ({
    find: async () => Promise.resolve([]),
    findByEmail: async () => Promise.resolve({ ...user, password }),
    findById: async () => Promise.resolve({ ...user, password }),
    findOne: async () => Promise.resolve(user),
    signAsync: async () => Promise.resolve(token),
    create: (value: any) => value,
    insert: async () => Promise.resolve([]),
    update: async () => Promise.resolve([]),
    delete: async () => Promise.resolve([]),
    verify: () => true,
    get: (key: string, defaultValue?: string) => defaultValue,
    getOrThrow: (key: string, defaultValue?: string) => defaultValue,
    t: (value: unknown) => value,
    emit: async (event: string, data: unknown) =>
      new Observable((s) => s.next(data)),
    send: async (id: unknown) => new Observable((s) => s.next(id)),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: I18nService, useClass: mockRepository },
        { provide: ConfigService, useClass: mockRepository },
        { provide: JwtService, useClass: mockRepository },
        { provide: JwtStrategy, useClass: mockRepository },
        { provide: FileService, useClass: mockRepository },
        { provide: MAIL_SERVICE, useClass: mockRepository },
        {
          provide: getRepositoryToken(UserEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(UserResponse),
          useClass: mockRepository,
        },
        { provide: RefreshTokenService, useClass: mockRepository },
        {
          provide: getRepositoryToken(FileEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FolderEntity),
          useClass: mockRepository,
        },
        AuthService,
        UserService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    user = userService.userRepository.create({
      id: '1',
      email,
      surname: 'Steve',
      name: 'John',
      middleName: 'Doe',
      password,
      phoneNumber: '+78002000000',
      city: 'Krasnodar',
      country: 'RU',
      company: 'ACME corporation',
      role: UserRoleEnum.Advertiser,
      verified: true,
      disabled: false,
      plan: UserPlanEnum.Full,
      createdAt: new Date('1000-01-01T01:00:50.804Z'),
      updatedAt: new Date('1000-01-01T01:00:43.121Z'),
    });
    userResponse = userService.userResponseRepository.create({
      ...user,
      // fullName: 'Steve John Doe',
      // fullNameEmail: 'Steve John Doe <foo@bar.baz>',
      // countMonitors: 0,
      // emptyMonitors: 0,
      // onlineMonitors: 0,
      // offlineMonitors: 0,
      //   metrics: {
      //     monitors: {
      //       online: 0,
      //       offline: 0,
      //       empty: 0,
      //       user: 0,
      //     },
      //     playlists: {
      //       added: 0,
      //       played: 0,
      //     },
      //     storageSpace: {
      //       storage: 0,
      //       total: 0,
      //     },
      //   },
      //   planValidityPeriod: Number.POSITIVE_INFINITY,
      //   wallet: {
      //     total: 0,
      //   },
    });
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('login', async () => {
    const login = await service.login(email, password);
    expect(login).toEqual([
      userResponse,
      { refreshToken: token, token, type: 'bearer' },
    ]);
  });

  // TODO: should inspect:
  // TODO: - buildResponsePayload, generateAccessToken, generateRefreshToken
  // TODO: - resolveRefreshToken, createAccessTokenFromRefreshToken, decodeRefreshToken
  // TODO: - getUserFromRefreshTokenPayload, getStoredTokenFromRefreshTokenPayload, verifyEmail
});
