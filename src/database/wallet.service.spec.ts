import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { WalletService } from './wallet.service';
import { WalletEntity } from './wallet.entity';
import { UserService } from './user.service';
import { ActService } from './act.service';
import { MAIL_SERVICE } from '@/constants';
import { WSGateway } from '@/websocket/ws.gateway';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  remove: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  getOrThrow: (key: string, defaultValue?: string) => '250',
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(WalletService.name, () => {
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: UserService, useClass: mockRepository },
        { provide: ConfigService, useClass: mockRepository },
        { provide: MAIL_SERVICE, useClass: mockRepository },
        { provide: ActService, useClass: mockRepository },
        { provide: WSGateway, useClass: mockRepository },
        {
          provide: getRepositoryToken(WalletEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
