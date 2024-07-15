import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  FindOneOptions,
  FindOptionsWhere,
  InsertResult,
  ObjectLiteral,
  UpdateResult,
} from 'typeorm';

import { MonitorEntity } from './monitor.entity';
import { MonitorFavoriteEntity } from './monitor.favorite.entity';
import { MonitorService } from './monitor.service';
import { BidService } from './bid.service';
import { MonitorGroupEntity } from './monitor.group.entity';
import { WalletService } from './wallet.service';
import { WSGateway } from '@/websocket/ws.gateway';

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

describe(MonitorService.name, () => {
  let service: MonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitorService,
        { provide: WSGateway, useClass: mockRepository },
        { provide: BidService, useClass: mockRepository },
        { provide: WalletService, useClass: mockRepository },
        {
          provide: getRepositoryToken(MonitorEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(MonitorGroupEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(MonitorFavoriteEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MonitorService>(MonitorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns monitor.findOne', async () => {
    const find = await service.findOne({
      find: {
        where: { id: '0000-0000-0000-0000' },
      },
    });
    expect(find).toStrictEqual({ id: '0000-0000-0000-0000' });
  });
});
