import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlaylistEntity } from './playlist.entity';
import { PlaylistService } from './playlist.service';

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

describe(PlaylistService.name, () => {
  let playlistService: PlaylistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistService,
        {
          provide: getRepositoryToken(PlaylistEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    playlistService = module.get<PlaylistService>(PlaylistService);
  });

  it('should be defined', () => {
    expect(playlistService).toBeDefined();
  });
});
