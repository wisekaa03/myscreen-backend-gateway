import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  type FindOneOptions,
  type FindManyOptions,
  DeleteResult,
} from 'typeorm';

import { FolderEntity } from './folder.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class FolderService {
  private logger = new Logger(FolderService.name);

  constructor(
    @InjectRepository(FolderEntity)
    private readonly folderRepository: Repository<FolderEntity>,
  ) {}

  find = async (
    find: FindManyOptions<FolderEntity>,
  ): Promise<[FolderEntity[], number]> =>
    this.folderRepository.findAndCount(find);

  findOne = async (
    find: FindOneOptions<FolderEntity>,
  ): Promise<FolderEntity | undefined> => this.folderRepository.findOne(find);

  rootFolder = async (user: UserEntity): Promise<FolderEntity> =>
    this.folderRepository.save(
      this.folderRepository.create({
        userId: user.id,
        name: '<Корень>',
        parentFolderId: null,
      }),
    );

  update = async (folder: Partial<FolderEntity>): Promise<FolderEntity> =>
    this.folderRepository.save(this.folderRepository.create(folder));

  delete = async (
    user: UserEntity,
    folder: FolderEntity,
  ): Promise<DeleteResult> =>
    this.folderRepository.delete({
      id: folder.id,
      userId: user.id,
    });
}
