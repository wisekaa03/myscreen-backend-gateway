import { Test, TestingModule } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock } from '@golevelup/ts-jest';
import { getEntityManagerToken, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { BidEntity } from './bid.entity';
import { BidService } from './bid.service';
import { UserService } from './user.service';
import { MonitorEntity } from './monitor.entity';
import { MonitorService } from './monitor.service';
import { EditorService } from './editor.service';
import { FileService } from './file.service';
import { ActService } from './act.service';
import { WalletService } from './wallet.service';
import { PlaylistEntity } from './playlist.entity';
import { WsStatistics } from './ws.statistics';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  insert: async () => Promise.resolve([]),
  update: async () => Promise.resolve([]),
  remove: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  getOrThrow: (key: string, defaultValue?: string) => '5',
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(BidService.name, () => {
  let service: BidService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BidService,
        { provide: UserService, useClass: mockRepository },
        { provide: ActService, useClass: mockRepository },
        { provide: MonitorService, useClass: mockRepository },
        { provide: FileService, useClass: mockRepository },
        { provide: EditorService, useClass: mockRepository },
        { provide: ConfigService, useClass: mockRepository },
        { provide: WsStatistics, useClass: mockRepository },
        { provide: WalletService, useClass: mockRepository },
        {
          provide: getRepositoryToken(MonitorEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(BidEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(PlaylistEntity),
          useClass: mockRepository,
        },
        {
          provide: getEntityManagerToken(),
          useClass: mockRepository,
        },
        { provide: AmqpConnection, useValue: createMock<AmqpConnection>() },
      ],
    }).compile();

    service = module.get(BidService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
