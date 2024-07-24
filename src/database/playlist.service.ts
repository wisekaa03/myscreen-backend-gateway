import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  DeleteResult,
  FindOptionsWhere,
  Repository,
} from 'typeorm';

import { NotFoundError } from '@/errors';
import { FindManyOptionsExt, FindOneOptionsExt } from '@/interfaces';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { UserRoleEnum } from '@/enums/user-role.enum';
import { PlaylistEntity } from './playlist.entity';
import { UserEntity } from './user.entity';
import { WsStatistics } from './ws.statistics';

@Injectable()
export class PlaylistService {
  constructor(
    @Inject(forwardRef(() => WsStatistics))
    private readonly wsStatistics: WsStatistics,
    @InjectRepository(PlaylistEntity)
    private readonly playlistRepository: Repository<PlaylistEntity>,
  ) {}

  async find({
    caseInsensitive = true,
    ...find
  }: FindManyOptionsExt<PlaylistEntity>): Promise<PlaylistEntity[]> {
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

  async findAndCount({
    caseInsensitive = true,
    ...find
  }: FindManyOptionsExt<PlaylistEntity>): Promise<[PlaylistEntity[], number]> {
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

  async findOne({
    ...find
  }: FindOneOptionsExt<PlaylistEntity>): Promise<PlaylistEntity | null> {
    return this.playlistRepository.findOne({
      relations: { files: true, monitors: true },
      ...TypeOrmFind.findParams(PlaylistEntity, find),
    });
  }

  async count(find: FindManyOptionsExt<PlaylistEntity>): Promise<number> {
    return this.playlistRepository.count(
      TypeOrmFind.findParams(PlaylistEntity, find),
    );
  }

  async create(insert: DeepPartial<PlaylistEntity>): Promise<PlaylistEntity> {
    const playlistCreated = await this.playlistRepository.save(
      this.playlistRepository.create(insert),
    );
    const playlist = await this.playlistRepository.findOne({
      where: { id: playlistCreated.id },
      relations: { user: true, files: true },
    });
    if (!playlist) {
      throw new NotFoundError('PLAYLIST_NOT_FOUND', {
        args: { id: playlistCreated.id },
      });
    }

    await Promise.all([
      this.wsStatistics.onChangePlaylist(playlist.user, playlist),
      this.wsStatistics.onMetrics(playlist.user),
    ]);

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
      throw new NotFoundError('PLAYLIST_NOT_FOUND', { args: { id } });
    }

    const playlist = await this.findOne({ where: { id } });
    if (!playlist) {
      throw new NotFoundError('PLAYLIST_NOT_FOUND', { args: { id } });
    }
    if (update.status === undefined) {
      await this.wsStatistics.onChangePlaylist(playlist.user, playlist);
    }

    return playlist;
  }

  async delete(
    user: UserEntity,
    playlist: PlaylistEntity,
  ): Promise<DeleteResult> {
    await this.wsStatistics.onChangePlaylistDelete(user, playlist);

    const deleteQuery: FindOptionsWhere<PlaylistEntity> = { id: playlist.id };
    if (user.role !== UserRoleEnum.Administrator) {
      deleteQuery.userId = user.id;
    }

    return this.playlistRepository.delete(deleteQuery);
  }
}
