import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  Repository,
} from 'typeorm';

import { PlaylistEntity } from './playlist.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(PlaylistEntity)
    private readonly playlistEntity: Repository<PlaylistEntity>,
  ) {}

  find = async (
    find: FindManyOptions<PlaylistEntity>,
  ): Promise<PlaylistEntity[]> =>
    this.playlistEntity.find({ relations: ['files'], ...find });

  findAndCount = async (
    find: FindManyOptions<PlaylistEntity>,
  ): Promise<[Array<PlaylistEntity>, number]> =>
    this.playlistEntity.findAndCount({
      relations: ['files'],
      ...find,
    });

  findOne = async (
    find: FindManyOptions<PlaylistEntity>,
  ): Promise<PlaylistEntity | undefined> =>
    this.playlistEntity.findOne({ ...find, relations: ['files'] });

  async update(
    user: UserEntity,
    update: Partial<PlaylistEntity>,
  ): Promise<PlaylistEntity> {
    const playlist: DeepPartial<PlaylistEntity> = {
      userId: user.id,
      ...update,
    };

    return this.playlistEntity.save(this.playlistEntity.create(playlist));
  }

  async delete(
    user: UserEntity,
    playlist: PlaylistEntity,
  ): Promise<DeleteResult> {
    return this.playlistEntity.delete({ id: playlist.id, userId: user.id });
  }
}
