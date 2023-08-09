import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import { UserService } from '@/database/user.service';
import { RefreshTokenService } from '@/database/refreshtoken.service';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UserPlanEnum } from '@/enums';

const email = 'foo@bar.baz';
const password = 'Secret~123456';
const token = 'token';

const user = {
  id: '1',
  email,
  surname: 'Steve',
  name: 'John',
  middleName: 'Doe',
  phoneNumber: '+78002000000',
  city: 'Krasnodar',
  country: 'RU',
  company: 'ACME corporation',
  role: 'advertiser',
  verified: true,
  plan: UserPlanEnum.Full,
  createdAt: '1000-01-01T01:00:50.804Z',
  updatedAt: '1000-01-01T01:00:43.121Z',
  countUsedSpace: 0,
  countMonitors: 0,
  wallet: {
    total: 0,
  },
};

export const mockRepository = jest.fn(() => ({
  findByEmail: async () => Promise.resolve({ ...user, password }),
  signAsync: async () => Promise.resolve(token),
  create: async () => Promise.resolve({ id: '1' }),
  verify: () => true,
  get: (key: string, defaultValue?: string) => defaultValue,
}));
UserService.validateCredentials = () => true;

describe(AuthService.name, () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useClass: mockRepository },
        { provide: UserService, useClass: mockRepository },
        { provide: RefreshTokenService, useClass: mockRepository },
        { provide: JwtService, useClass: mockRepository },
        { provide: JwtStrategy, useClass: mockRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('login', async () => {
    const login = await service.login(email, password);
    expect(login).toEqual([
      user,
      { refreshToken: token, token, type: 'bearer' },
    ]);
  });

  // TODO: should inspect:
  // TODO: - buildResponsePayload, generateAccessToken, generateRefreshToken
  // TODO: - resolveRefreshToken, createAccessTokenFromRefreshToken, decodeRefreshToken
  // TODO: - getUserFromRefreshTokenPayload, getStoredTokenFromRefreshTokenPayload, verifyEmail
});
