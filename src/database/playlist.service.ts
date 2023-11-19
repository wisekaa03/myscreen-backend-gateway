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
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { TypeOrmFind } from '@/utils/typeorm.find';
import { UserRoleEnum } from '@/enums/user-role.enum';
import { PlaylistEntity } from './playlist.entity';
import { UserEntity } from './user.entity';
import { ApplicationService } from '@/database/application.service';

@Injectable()
export class PlaylistService {
  constructor(
    @Inject(forwardRef(() => ApplicationService))
    private readonly applicationService: ApplicationService,
    @InjectRepository(PlaylistEntity)
    private readonly playlistEntity: Repository<PlaylistEntity>,
  ) {}

  async find(
    find: FindManyOptions<PlaylistEntity>,
    caseInsensitive = true,
  ): Promise<PlaylistEntity[]> {
    return caseInsensitive
      ? TypeOrmFind.findCI(this.playlistEntity, {
          relations: { files: true, monitors: true },
          ...TypeOrmFind.Nullable(find),
        })
      : this.playlistEntity.find({
          relations: { files: true, monitors: true },
          ...TypeOrmFind.Nullable(find),
        });
  }

  async findAndCount(
    find: FindManyOptions<PlaylistEntity>,
    caseInsensitive = true,
  ): Promise<[Array<PlaylistEntity>, number]> {
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(this.playlistEntity, {
          relations: { files: true, monitors: true },
          ...TypeOrmFind.Nullable(find),
        })
      : this.playlistEntity.findAndCount({
          relations: { files: true, monitors: true },
          ...TypeOrmFind.Nullable(find),
        });
  }

  async findOne(
    find: FindManyOptions<PlaylistEntity>,
  ): Promise<PlaylistEntity | null> {
    return this.playlistEntity.findOne({
      relations: { files: true, monitors: true },
      ...TypeOrmFind.Nullable(find),
    });
  }

  async create(insert: DeepPartial<PlaylistEntity>): Promise<PlaylistEntity> {
    const playlist = await this.playlistEntity.save(
      this.playlistEntity.create(insert),
    );

    await this.applicationService.websocketChange({ playlist });

    return playlist;
  }

  async update(
    id: string,
    insert: QueryDeepPartialEntity<PlaylistEntity>,
  ): Promise<PlaylistEntity> {
    const updated = await this.playlistEntity.update(id, insert);
    if (!updated.affected) {
      throw new NotAcceptableException(`Playlist with this ${id} not found`);
    }

    const playlist = await this.findOne({ where: { id } });
    if (!playlist) {
      throw new NotFoundException(`Playlist with this ${id} not found`);
    }
    await this.applicationService.websocketChange({ playlist });

    return playlist;
  }

  async delete(
    user: UserEntity,
    playlist: PlaylistEntity,
  ): Promise<DeleteResult> {
    await this.applicationService.websocketChange({
      playlist,
      playlistDelete: true,
    });

    const deleteQuery: FindOptionsWhere<PlaylistEntity> = { id: playlist.id };
    if (user.role !== UserRoleEnum.Administrator) {
      deleteQuery.userId = user.id;
    }

    return this.playlistEntity.delete(deleteQuery);
  }
}
