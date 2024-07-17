import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { PlaylistEntity } from './playlist.entity';
import { PlaylistService } from './playlist.service';
import { BidService } from './bid.service';
import { WalletService } from './wallet.service';
import { WsStatistics } from './ws.statistics';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  remove: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(PlaylistService.name, () => {
  let service: PlaylistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistService,
        { provide: BidService, useClass: mockRepository },
        { provide: WalletService, useClass: mockRepository },
        { provide: WsStatistics, useClass: mockRepository },
        {
          provide: getRepositoryToken(PlaylistEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PlaylistService>(PlaylistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
