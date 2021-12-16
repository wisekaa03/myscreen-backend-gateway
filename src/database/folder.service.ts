import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type FindOneOptions, type FindManyOptions } from 'typeorm';

import { FolderEntity } from './folder.entity';

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
    find: FindOneOptions<FolderEntity>,
  ): Promise<FolderEntity | undefined> => this.folderRepository.findOne(find);

  updateFolder = async (folder: Partial<FolderEntity>): Promise<FolderEntity> =>
    this.folderRepository.save(this.folderRepository.create(folder));

  deleteFolder = async (folder: FolderEntity): Promise<FolderEntity> =>
    this.folderRepository.remove(folder);
}
