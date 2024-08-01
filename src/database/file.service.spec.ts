import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken, getRepositoryToken } from '@nestjs/typeorm';
import { getS3ConnectionToken } from 'nestjs-s3-aws';
import { S3_MODULE_CONNECTION } from 'nestjs-s3-aws/dist/s3.constants';
import { FfprobeData } from 'media-probe';

import { FileEntity } from './file.entity';
import { FilePreviewEntity } from './file-preview.entity';
import { FileService } from './file.service';
import { EditorEntity } from './editor.entity';
import { MonitorEntity } from './monitor.entity';
import { PlaylistEntity } from './playlist.entity';
import { FolderEntity } from './folder.entity';
import { WsStatistics } from './ws.statistics';
import { FileExtView } from './file-ext.view';
import { FileType, UserStoreSpaceEnum } from '@/enums';
import { PutObjectCommandOutput } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/s3-request-presigner');

const idMock = '00000000-0000-0000-0000-000000000000';

const fileMock: Partial<FileEntity> = {
  id: idMock,
  folderId: idMock,
  name: 'test',
  hash: 'test',
  extension: '.mp4',
  type: FileType.VIDEO,
  duration: 10,
  filesize: 200000,
  height: 100,
  width: 100,
  userId: idMock,
};

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve(fileMock),
  findAndCount: async () => Promise.resolve(fileMock),
  save: async () => Promise.resolve(fileMock),
  create: () => [],
  insert: async () => Promise.resolve([]),
  update: async () => Promise.resolve([]),
  remove: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  getOrThrow: (key: string, defaultValue?: string) => 'upload',
  putObject: async () =>
    Promise.resolve({
      ETag: '1234567890',
    } as PutObjectCommandOutput),
  onMetrics: async () => Promise.resolve(),
  metadata: {
    columns: [],
    relations: [],
  },
}));

const mockEntityManager = {
  transaction: jest.fn().mockImplementation((level, transactionalFunction) => {
    return transactionalFunction(mockEntityManager);
  }),
  find: async () => Promise.resolve([]),
  findOne: async () => Promise.resolve(fileMock),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve(fileMock),
  create: () => fileMock,
  remove: async () => Promise.resolve([]),
  update: async () => Promise.resolve({ affected: 1 }),
  withRepository: () => mockEntityManager,
  metadata: {
    columns: [],
    relations: [],
  },
};

describe(FileService.name, () => {
  let service: FileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: ConfigService, useClass: mockRepository },
        { provide: WsStatistics, useClass: mockRepository },
        {
          provide: getS3ConnectionToken(S3_MODULE_CONNECTION),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FolderEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FileEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FilePreviewEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(EditorEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(MonitorEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(PlaylistEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FileExtView),
          useClass: mockRepository,
        },
        {
          provide: getEntityManagerToken(),
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('upload', async () => {
    const info: FfprobeData = {};
    const file = Buffer.from('test');
    const files = await service.upload({
      userId: idMock,
      storageSpace: UserStoreSpaceEnum.DEMO,
      files: file,
      folderId: idMock,
      originalname: 'test.mp4',
      mimetype: 'video/mp4',
      info,
    });
    expect(files).toStrictEqual([fileMock]);
  });
});
