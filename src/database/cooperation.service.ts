import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';

import { TypeOrmFind } from '@/shared/typeorm.find';
import { CooperationEntity } from './cooperation.entity';

@Injectable()
export class CooperationService {
  constructor(
    @InjectRepository(CooperationEntity)
    private readonly cooperationRepository: Repository<CooperationEntity>,
  ) {}

  async find(
    find: FindManyOptions<CooperationEntity>,
    caseInsensitive = true,
  ): Promise<Array<CooperationEntity>> {
    const conditional = TypeOrmFind.Nullable(find);
    if (!find.relations) {
      conditional.relations = ['buyer', 'seller', 'monitor', 'playlist'];
    }
    return caseInsensitive
      ? TypeOrmFind.findCI(this.cooperationRepository, conditional)
      : this.cooperationRepository.find(conditional);
  }

  async findAndCount(
    find: FindManyOptions<CooperationEntity>,
    caseInsensitive = true,
  ): Promise<[Array<CooperationEntity>, number]> {
    const conditional = TypeOrmFind.Nullable(find);
    if (!find.relations) {
      conditional.relations = ['buyer', 'seller', 'monitor', 'playlist'];
    }
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(this.cooperationRepository, conditional)
      : this.cooperationRepository.findAndCount(conditional);
  }

  async findOne(
    find: FindManyOptions<CooperationEntity>,
  ): Promise<CooperationEntity | null> {
    return find.relations
      ? this.cooperationRepository.findOne(TypeOrmFind.Nullable(find))
      : this.cooperationRepository.findOne({
          relations: ['buyer', 'seller', 'monitor', 'playlist'],
          ...TypeOrmFind.Nullable(find),
        });
  }
}
