import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CooperationEntity } from './cooperation.entity';
import { CooperationService } from './cooperation.service';

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

describe(CooperationService.name, () => {
  let service: CooperationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CooperationService,
        {
          provide: getRepositoryToken(CooperationEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CooperationService>(CooperationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
