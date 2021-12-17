import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getS3ConnectionToken } from 'nestjs-s3';
import { S3_MODULE_CONNECTION } from 'nestjs-s3/dist/s3.constants';

import { FolderService } from './folder.service';
import { MediaEntity } from './media.entity';
import { MediaService } from './media.service';

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

describe(MediaService.name, () => {
  let mediaService: MediaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        ConfigService,
        {
          provide: getRepositoryToken(MediaEntity),
          useClass: mockRepository,
        },
        {
          provide: getS3ConnectionToken(S3_MODULE_CONNECTION),
          useClass: mockRepository,
        },
        {
          provide: FolderService,
          useClass: mockRepository,
        },
      ],
    }).compile();

    mediaService = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(mediaService).toBeDefined();
  });

  // TODO: should inspect:
  // TODO: - getMediaFiles, getMediaFile, upload, getMediaFileS3, delete, metaInformation
});
