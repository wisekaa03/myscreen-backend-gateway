import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UserEntity } from './user.entity';
import { UserSizeEntity } from './user.view.entity';
import { UserService } from './user.service';
import { MailService } from '@/mail/mail.service';

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

describe(UserService.name, () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        ConfigService,
        {
          provide: getRepositoryToken(UserEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(UserSizeEntity),
          useClass: mockRepository,
        },
        {
          provide: MailService,
          useClass: mockRepository,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  // TODO: should inspect:
  // TODO: - update, delete, create, findAll, findByEmail, findById
  // TODO: - forgotPasswordInvitation, forgotPasswordVerify, validateCredentials
});
