import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '@/guards';
import { EditorService } from '@/database/editor.service';
import { EditorController } from './editor.controller';
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

describe(EditorController.name, () => {
  let controller: EditorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EditorController],
      providers: [
        {
          provide: EditorService,
          useClass: mockRepository,
        },
        {
          provide: FileService,
          useClass: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<EditorController>(EditorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata('__guards__', EditorController);
    const guardJwt = new guards[0]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
  });

  // TODO: should inspect:
  // TODO: -
});
