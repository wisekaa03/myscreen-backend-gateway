import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindManyOptions } from 'typeorm';

import { FolderEntity } from './folder.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class FolderService {
  private logger = new Logger(FolderService.name);

  constructor(
    @InjectRepository(FolderEntity)
    private readonly folderRepository: Repository<FolderEntity>,
  ) {}

  findFolders = async (
    find: FindManyOptions<FolderEntity>,
  ): Promise<[FolderEntity[], number]> =>
    this.folderRepository.findAndCount(find);

  findFolder = async (
    where: FindOneOptions<FolderEntity>,
  ): Promise<FolderEntity | undefined> => this.folderRepository.findOne(where);

  createFolder = async (
    user: UserEntity,
    name: string,
    parentFolderId: string,
  ): Promise<FolderEntity> =>
    this.folderRepository.save(
      this.folderRepository.create({
        user,
        parentFolderId,
        name,
      }),
    );
}
