import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';

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
  ): Promise<[Array<PlaylistEntity>, number]> =>
    this.playlistEntity.findAndCount(find);

  findOne = async (
    find: FindManyOptions<PlaylistEntity>,
  ): Promise<PlaylistEntity | undefined> => this.playlistEntity.findOne(find);

  async create(user: UserEntity): Promise<PlaylistEntity> {
    const playlist: DeepPartial<PlaylistEntity> = {
      user,
    };

    return this.playlistEntity.save(this.playlistEntity.create(playlist));
  }
}
