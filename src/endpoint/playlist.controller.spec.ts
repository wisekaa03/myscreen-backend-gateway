import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';

import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { PlaylistService } from '@/database/playlist.service';
import { FileService } from '@/database/file.service';
import { UserService } from '@/database/user.service';
import { ApplicationService } from '@/database/application.service';
import { PlaylistController } from './playlist.controller';

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

describe(PlaylistController.name, () => {
  let controller: PlaylistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaylistController],
      providers: [
        { provide: UserService, useClass: mockRepository },
        { provide: PlaylistService, useClass: mockRepository },
        { provide: FileService, useClass: mockRepository },
      ],
    }).compile();

    controller = module.get<PlaylistController>(PlaylistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, PlaylistController);
    const guardJwt = new guards[0]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
  });

  // DEBUG: should inspect:
  // DEBUG: -
});
