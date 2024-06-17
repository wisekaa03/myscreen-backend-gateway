import {
  Inject,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';

import { TypeOrmFind } from '@/utils/typeorm.find';
import { UserRoleEnum } from '@/enums/user-role.enum';
import { PlaylistEntity } from './playlist.entity';
import { UserEntity } from './user.entity';
import { BidService } from '@/database/bid.service';

@Injectable()
export class PlaylistService {
  constructor(
    @Inject(forwardRef(() => BidService))
    private readonly bidService: BidService,
    @InjectRepository(PlaylistEntity)
    private readonly playlistRepository: Repository<PlaylistEntity>,
  ) {}

  async find(
    find: FindManyOptions<PlaylistEntity>,
    caseInsensitive = true,
  ): Promise<PlaylistEntity[]> {
    return caseInsensitive
      ? TypeOrmFind.findCI(this.playlistRepository, {
          relations: { files: true, monitors: true },
          ...TypeOrmFind.findParams(PlaylistEntity, find),
        })
      : this.playlistRepository.find({
          relations: { files: true, monitors: true },
          ...TypeOrmFind.findParams(PlaylistEntity, find),
        });
  }

  async findAndCount(
    find: FindManyOptions<PlaylistEntity>,
    caseInsensitive = true,
  ): Promise<[PlaylistEntity[], number]> {
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(this.playlistRepository, {
          relations: { files: true, monitors: true },
          ...TypeOrmFind.findParams(PlaylistEntity, find),
        })
      : this.playlistRepository.findAndCount({
          relations: { files: true, monitors: true },
          ...TypeOrmFind.findParams(PlaylistEntity, find),
        });
  }

  async findOne(
    find: FindManyOptions<PlaylistEntity>,
  ): Promise<PlaylistEntity | null> {
    return this.playlistRepository.findOne({
      relations: { files: true, monitors: true },
      ...TypeOrmFind.findParams(PlaylistEntity, find),
    });
  }

  async create(insert: DeepPartial<PlaylistEntity>): Promise<PlaylistEntity> {
    const playlist = await this.playlistRepository.save(
      this.playlistRepository.create(insert),
    );

    await this.bidService.websocketChange({ playlist });

    return playlist;
  }

  async update(
    id: string,
    update: Partial<PlaylistEntity>,
  ): Promise<PlaylistEntity> {
    const updated = await this.playlistRepository.save(
      this.playlistRepository.create({ id, ...update }),
    );
    if (!updated) {
      throw new NotAcceptableException(`Playlist with this '${id}' not found`);
    }

    const playlist = await this.findOne({ where: { id } });
    if (!playlist) {
      throw new NotFoundException(`Playlist with this '${id}' not found`);
    }
    if (update.status === undefined) {
      await this.bidService.websocketChange({ playlist });
    }

    return playlist;
  }

  async delete(
    user: UserEntity,
    playlist: PlaylistEntity,
  ): Promise<DeleteResult> {
    await this.bidService.websocketChange({ playlistDelete: playlist });

    const deleteQuery: FindOptionsWhere<PlaylistEntity> = { id: playlist.id };
    if (user.role !== UserRoleEnum.Administrator) {
      deleteQuery.userId = user.id;
    }

    return this.playlistRepository.delete(deleteQuery);
  }
}
