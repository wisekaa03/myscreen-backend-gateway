import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  Repository,
} from 'typeorm';

import { TypeOrmFind } from '@/shared/type-orm-find';
import { PlaylistEntity } from './playlist.entity';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(PlaylistEntity)
    private readonly playlistEntity: Repository<PlaylistEntity>,
  ) {}

  async find(
    find: FindManyOptions<PlaylistEntity>,
    caseInsensitive = true,
  ): Promise<PlaylistEntity[]> {
    return caseInsensitive
      ? TypeOrmFind.findCI(this.playlistEntity, {
          relations: ['files', 'monitors'],
          ...TypeOrmFind.Nullable(find),
        })
      : this.playlistEntity.find({
          relations: ['files', 'monitors'],
          ...TypeOrmFind.Nullable(find),
        });
  }

  async findAndCount(
    find: FindManyOptions<PlaylistEntity>,
    caseInsensitive = true,
  ): Promise<[Array<PlaylistEntity>, number]> {
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(this.playlistEntity, {
          relations: ['files', 'monitors'],
          ...TypeOrmFind.Nullable(find),
        })
      : this.playlistEntity.findAndCount({
          relations: ['files', 'monitors'],
          ...TypeOrmFind.Nullable(find),
        });
  }

  async findOne(
    find: FindManyOptions<PlaylistEntity>,
  ): Promise<PlaylistEntity | null> {
    return this.playlistEntity.findOne({
      relations: ['files', 'monitors'],
      ...TypeOrmFind.Nullable(find),
    });
  }

  async update(
    userId: string,
    update: Partial<PlaylistEntity>,
  ): Promise<PlaylistEntity> {
    const playlist: DeepPartial<PlaylistEntity> = {
      userId,
      ...update,
    };

    return this.playlistEntity.save(this.playlistEntity.create(playlist));
  }

  async delete(
    userId: string,
    playlist: PlaylistEntity,
  ): Promise<DeleteResult> {
    return this.playlistEntity.delete({ id: playlist.id, userId });
  }
}
