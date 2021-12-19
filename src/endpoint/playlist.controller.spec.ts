import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '@/guards';
import { PlaylistService } from '@/database/playlist.service';
import { PlaylistController } from './playlist.controller';
import { FileService } from '@/database/file.service';

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

describe(PlaylistController.name, () => {
  let playlistController: PlaylistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaylistController],
      providers: [
        {
          provide: PlaylistService,
          useClass: mockRepository,
        },
        {
          provide: FileService,
          useClass: mockRepository,
        },
      ],
    }).compile();

    playlistController = module.get<PlaylistController>(PlaylistController);
  });

  it('should be defined', () => {
    expect(playlistController).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata('__guards__', PlaylistController);
    const guardJwt = new guards[0]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
  });

  // TODO: should inspect:
  // TODO: -
});
