import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  type FindOneOptions,
  type FindManyOptions,
  DeleteResult,
  Transaction,
  TransactionRepository,
} from 'typeorm';

import { FileService } from '@/database/file.service';
import { FolderEntity } from './folder.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class FolderService {
  private logger = new Logger(FolderService.name);

  constructor(
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
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

  rootFolder = async (userId: string): Promise<FolderEntity> => {
    const folder = await this.folderRepository.findOne({
      userId,
      name: '<Корень>',
    });

    return this.folderRepository.save(
      this.folderRepository.create({
        ...folder,
        userId,
        name: '<Корень>',
        parentFolderId: null,
      }),
    );
  };

  update = async (folder: Partial<FolderEntity>): Promise<FolderEntity> =>
    this.folderRepository.save(this.folderRepository.create(folder));

  @Transaction()
  async delete(
    userId: string,
    folder: FolderEntity,
    @TransactionRepository(FolderEntity)
    folderRepository: Repository<FolderEntity> = this.folderRepository,
  ): Promise<DeleteResult> {
    const files = await this.fileService.find(
      {
        where: { userId, folderId: folder.id },
      },
      false,
    );

    const filesPromises = files.map((file) =>
      this.fileService.deleteS3Object(file),
    );
    await Promise.all(filesPromises);

    return folderRepository.delete({
      id: folder.id,
      userId,
    });
  }
}
