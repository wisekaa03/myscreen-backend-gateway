import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, FindManyOptions, Repository } from 'typeorm';

import { WSGateway } from '@/websocket/ws.gateway';
import { TypeOrmFind } from '@/shared/typeorm.find';
import { CooperationApproved } from '@/enums';
import { CooperationEntity } from './cooperation.entity';

@Injectable()
export class CooperationService {
  private logger = new Logger(CooperationService.name);

  constructor(
    private readonly wsGateway: WSGateway,
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

  async update(
    id: string | undefined,
    update: Partial<CooperationEntity>,
  ): Promise<CooperationEntity | null> {
    await this.cooperationRepository.manager.transaction(
      async (cooperationRepository) => {
        const cooperation = await cooperationRepository.save(
          this.cooperationRepository.create(update),
        );

        if (update.approved === CooperationApproved.Allowed) {
          /* await */ this.wsGateway
            .monitorPlaylist(cooperation.monitor, cooperation.playlist)
            .catch((error) => {
              this.logger.error(error);
            });
        }
      },
    );

    return this.cooperationRepository.findOne({
      where: { id },
    });
  }

  async delete(
    userId: string,
    cooperation: CooperationEntity,
  ): Promise<DeleteResult> {
    return this.cooperationRepository.delete({
      id: cooperation.id,
      userId,
    });
  }
}
