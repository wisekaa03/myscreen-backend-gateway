import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  FindOneOptions,
  FindOptionsWhere,
  InsertResult,
  ObjectLiteral,
  UpdateResult,
} from 'typeorm';

import { FileService } from './file.service';
import { FolderEntity } from './folder.entity';
import { FolderService } from './folder.service';
import { FolderFileNumberEntity } from './folder.view.entity';
import { FileEntity } from './file.entity';

export const mockRepository = jest.fn(() => ({
  find: async (find: FindOneOptions<ObjectLiteral>) =>
    Promise.resolve({
      id: (find?.where as FindOptionsWhere<ObjectLiteral>)?.id,
    }),
  findOne: async (find: FindOneOptions<ObjectLiteral>) =>
    Promise.resolve({
      id: (find?.where as FindOptionsWhere<ObjectLiteral>)?.id,
    }),
  findAndCount: async (find: FindOneOptions<ObjectLiteral>) =>
    Promise.resolve([
      { id: (find?.where as FindOptionsWhere<ObjectLiteral>)?.id },
      1,
    ]),
  createQueryBuilder: () => ({
    setFindOptions: (find: unknown) => find,
    getOne: () => Promise.resolve({ id: '0000-0000-0000-0000' }),
  }),
  save: async (id: unknown) => Promise.resolve(id),
  insert: async () =>
    Promise.resolve<InsertResult>({
      generatedMaps: [],
      identifiers: [{ id: '0000-0000-0000-0000' }],
      raw: [],
    }),
  update: async () =>
    Promise.resolve<UpdateResult>({ affected: 1, raw: [], generatedMaps: [] }),
  create: (id: unknown) => id,
  remove: async () => Promise.resolve([]),
  delete: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(FolderService.name, () => {
  let service: FolderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FolderService,
        { provide: FileService, useClass: mockRepository },
        {
          provide: getRepositoryToken(FolderEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FileEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FolderFileNumberEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FolderService>(FolderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns folder.findOne', async () => {
    const find = await service.findOne({
      where: { id: '0000-0000-0000-0001' },
    });
    expect(find).toStrictEqual({ id: '0000-0000-0000-0001' });
  });

  it('returns folder.create', async () => {
    const folder = await service.create({ name: 'aaa' });
    expect(folder).toStrictEqual({ id: '0000-0000-0000-0000' });
  });

  it('returns folder.update', async () => {
    const folder = await service.update('0000-0000-0000-0004', {});
    expect(folder).toStrictEqual({ id: '0000-0000-0000-0004' });
  });

  // TODO: Implement
  // it('returns deleteFolder', async () => {
  //   expect(
  //     await folderService.delete({} as UserEntity, {} as FolderEntity),
  //   ).toBeDefined();
  // });
});
