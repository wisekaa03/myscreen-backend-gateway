import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  type FindOneOptions,
  type FindManyOptions,
  DeleteResult,
  In,
} from 'typeorm';

import { TypeOrmFind } from '@/shared/select-order-case-insensitive';
import { FileService } from '@/database/file.service';
import { FolderEntity } from './folder.entity';
import { FolderFileNumberEntity } from './folder.view.entity';

@Injectable()
export class FolderService {
  private logger = new Logger(FolderService.name);

  constructor(
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @InjectRepository(FolderEntity)
    private readonly folderRepository: Repository<FolderEntity>,
    @InjectRepository(FolderFileNumberEntity)
    private readonly folderFilenumberRepository: Repository<FolderFileNumberEntity>,
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
      ? TypeOrmFind.findAndCountCI(this.folderFilenumberRepository, find)
      : this.folderFilenumberRepository.findAndCount(find);
  }

  async findOne(
    find: FindOneOptions<FolderEntity>,
  ): Promise<FolderEntity | null> {
    return this.folderFilenumberRepository.findOne(find);
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

  async delete(userId: string, foldersId: string[]): Promise<DeleteResult> {
    return this.folderRepository.manager.transaction(
      async (folderRepository) => {
        const filesId = await this.fileService
          .find({
            where: { userId, folderId: In(foldersId) },
            relations: [],
            select: ['id'],
          })
          .then((files) => files.map((file) => file.id));
        await this.fileService.deletePrep(filesId);
        await this.fileService.delete(userId, filesId);

        return folderRepository.delete<FolderEntity>(FolderEntity, {
          userId,
          id: In(foldersId),
        });
      },
    );
  }
}
