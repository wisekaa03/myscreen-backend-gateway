import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  type FindOneOptions,
  type FindManyOptions,
  DeleteResult,
} from 'typeorm';

import { TypeOrmFind } from '@/shared/select-order-case-insensitive';
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

  async find(
    find: FindManyOptions<FolderEntity>,
    caseInsensitive = true,
  ): Promise<FolderEntity[]> {
    return caseInsensitive
      ? TypeOrmFind.findCI(this.folderRepository, find)
      : this.folderRepository.find(find);
  }

  async findAndCount(
    find: FindManyOptions<FolderEntity>,
    caseInsensitive = true,
  ): Promise<[FolderEntity[], number]> {
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(this.folderRepository, find)
      : this.folderRepository.findAndCount(find);
  }

  async findOne(
    find: FindOneOptions<FolderEntity>,
  ): Promise<FolderEntity | null> {
    return this.folderRepository.findOne(find);
  }

  async rootFolder(userId: string): Promise<FolderEntity> {
    // TODO: рассмотреть upsert
    const folder = await this.folderRepository.findOne({
      where: { userId, name: '<Корень>' },
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

  async delete(userId: string, folder: FolderEntity): Promise<DeleteResult> {
    return this.folderRepository.manager.transaction(
      async (folderRepository) => {
        const files = await this.fileService.find({
          where: { userId, folderId: folder.id },
          relations: [],
        });

        const filesPromises = files.map((file) =>
          this.fileService.deleteS3Object(file),
        );
        await Promise.allSettled(filesPromises);

        return folderRepository.delete<FolderEntity>(FolderEntity, {
          id: folder.id,
          userId,
        });
      },
    );
  }
}
