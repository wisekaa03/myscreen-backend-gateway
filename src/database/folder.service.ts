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

@Injectable()
export class FolderService {
  private logger = new Logger(FolderService.name);

  constructor(
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @InjectRepository(FolderEntity)
    private readonly folderRepository: Repository<FolderEntity>,
  ) {}

  async find(find: FindManyOptions<FolderEntity>): Promise<FolderEntity[]> {
    return this.folderRepository.find(find);
  }

  async findAndCount(
    find: FindManyOptions<FolderEntity>,
  ): Promise<[FolderEntity[], number]> {
    return this.folderRepository.findAndCount(find);
  }

  async findOne(
    find: FindOneOptions<FolderEntity>,
  ): Promise<FolderEntity | undefined> {
    return this.folderRepository.findOne(find);
  }

  async rootFolder(userId: string): Promise<FolderEntity> {
    // TODO: рассмотреть upsert
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
  }

  async update(folder: Partial<FolderEntity>): Promise<FolderEntity> {
    return this.folderRepository.save(this.folderRepository.create(folder));
  }

  @Transaction()
  async delete(
    userId: string,
    folder: FolderEntity,
    @TransactionRepository(FolderEntity)
    folderRepository: Repository<FolderEntity> = this.folderRepository,
  ): Promise<DeleteResult> {
    const files = await this.fileService.find({
      where: { userId, folderId: folder.id },
      relations: [],
    });

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
