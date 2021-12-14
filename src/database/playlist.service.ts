import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';

import { PlaylistEntity } from './playlist.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(PlaylistEntity)
    private readonly playlistEntity: Repository<PlaylistEntity>,
    private readonly configService: ConfigService,
  ) {}

  async find(
    find: FindManyOptions<PlaylistEntity>,
  ): Promise<[Array<PlaylistEntity>, number]> {
    return this.playlistEntity.findAndCount(find);
  }

  async findOne(
    find: FindManyOptions<PlaylistEntity>,
  ): Promise<PlaylistEntity | undefined> {
    return this.playlistEntity.findOne(find);
  }

  async create(user: UserEntity): Promise<PlaylistEntity> {
    const playlist: DeepPartial<PlaylistEntity> = {
      user,
    };

    return this.playlistEntity.save(this.playlistEntity.create(playlist));
  }
}
