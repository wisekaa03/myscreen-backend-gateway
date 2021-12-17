import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import { UserService } from '@/database/user.service';
import { RefreshTokenService } from '@/database/refreshtoken.service';
import { AuthService } from './auth.service';

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

describe(AuthService.name, () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        ConfigService,
        {
          provide: UserService,
          useClass: mockRepository,
        },
        {
          provide: RefreshTokenService,
          useClass: mockRepository,
        },
        {
          provide: JwtService,
          useClass: mockRepository,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  // TODO: should inspect:
  // TODO: - login, buildResponsePayload, generateAccessToken, generateRefreshToken
  // TODO: - resolveRefreshToken, createAccessTokenFromRefreshToken, decodeRefreshToken
  // TODO: - getUserFromRefreshTokenPayload, getStoredTokenFromRefreshTokenPayload, verifyEmail
});
