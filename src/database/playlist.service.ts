import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, FindManyOptions, Repository } from 'typeorm';

import { TypeOrmFind } from '@/utils/typeorm.find';
import { UserRoleEnum } from '@/enums/user-role.enum';
import { PlaylistEntity } from './playlist.entity';
import { UserEntity } from './user.entity';
import { ApplicationService } from './application.service';

@Injectable()
export class PlaylistService {
  constructor(
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
    const playlist = await this.playlistEntity.save(
      this.playlistEntity.create({
        userId,
        ...update,
      }),
    );

    await this.applicationService.websocketChange({ playlist });

    return playlist;
  }

  async delete(
    playlist: PlaylistEntity,
    user: UserEntity,
  ): Promise<DeleteResult> {
    await this.applicationService.websocketChange({
      playlist,
      playlistDelete: true,
    });

    if (user.role !== UserRoleEnum.Administrator) {
      return this.playlistEntity.delete({ id: playlist.id, userId: user.id });
    }
    return this.playlistEntity.delete({ id: playlist.id });
  }
}
