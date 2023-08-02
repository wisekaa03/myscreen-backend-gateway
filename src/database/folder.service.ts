import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  type FindOneOptions,
  type FindManyOptions,
  DeleteResult,
  In,
} from 'typeorm';

import { TypeOrmFind } from '@/utils/typeorm.find';
import { FileService } from '@/database/file.service';
import { FolderEntity } from './folder.entity';
import { FolderFileNumberEntity } from './folder.view.entity';
import { UserEntity } from './user.entity';

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
      ? TypeOrmFind.findCI(this.folderRepository, TypeOrmFind.Nullable(find))
      : this.folderRepository.find(TypeOrmFind.Nullable(find));
  }

  async findAndCount(
    find: FindManyOptions<FolderEntity>,
    caseInsensitive = true,
  ): Promise<[FolderEntity[], number]> {
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(
          this.folderFilenumberRepository,
          TypeOrmFind.Nullable(find),
        )
      : this.folderFilenumberRepository.findAndCount(
          TypeOrmFind.Nullable(find),
        );
  }

  async findOne(
    find: FindOneOptions<FolderEntity>,
  ): Promise<FolderEntity | null> {
    return this.folderFilenumberRepository.findOne(TypeOrmFind.Nullable(find));
  }

  async rootFolder(user: UserEntity): Promise<FolderEntity> {
    const folder = await this.folderRepository.findOne({
      where: { name: '<Корень>', userId: user.id },
    });

    return (
      folder ??
      this.update({
        name: '<Корень>',
        parentFolderId: null,
        userId: user.id,
      })
    );
  }

  async exportFolder(user: UserEntity): Promise<FolderEntity> {
    const rootFolder = await this.rootFolder(user);

    const folder = await this.findOne({
      where: {
        name: '<Исполненные>',
        parentFolderId: rootFolder.id,
        userId: user.id,
      },
    });

    return (
      folder ??
      this.update({
        name: '<Исполненные>',
        parentFolderId: rootFolder.id,
        userId: user.id,
      })
    );
  }

  async update(folder: Partial<FolderEntity>): Promise<FolderEntity> {
    return this.folderRepository.save(this.folderRepository.create(folder));
  }

  async copy(
    userId: string,
    toFolder: FolderEntity,
    originalFolders: FolderEntity[],
  ): Promise<FolderEntity[]> {
    return this.folderRepository.manager.transaction(
      async (folderRepository) => {
        const foldersPromise = originalFolders.map(async (folder) => {
          const folderCopyCreate = folderRepository.create(FolderEntity, {
            ...folder,
            userId,
            parentFolder: toFolder,
            parentFolderId: toFolder.id,
            id: undefined,
            user: undefined,
            files: undefined,
            createdAt: undefined,
            updatedAt: undefined,
          });
          const folderCopy = await folderRepository.save(
            FolderEntity,
            folderCopyCreate,
          );

          /* await */ this.fileService.copy(userId, folderCopy, folder.files);

          return folderCopy;
        });

        return Promise.all(foldersPromise);
      },
    );
  }

  async delete(user: UserEntity, foldersId: string[]): Promise<DeleteResult> {
    return this.folderRepository.manager.transaction(
      async (folderRepository) => {
        const folderSubId = await folderRepository
          .find<FolderEntity>(FolderEntity, {
            where: { userId: user.id, parentFolderId: In(foldersId) },
            relations: [],
            loadEagerRelations: false,
            select: ['id'],
          })
          .then((folders) => folders.map((folder) => folder.id));

        const fullFolders = [...foldersId, ...folderSubId];
        const filesId = await this.fileService
          .find({
            where: { userId: user.id, folderId: In(fullFolders) },
            relations: [],
            loadEagerRelations: false,
            select: ['id'],
          })
          .then((files) => files.map((file) => file.id));
        await this.fileService.deletePrep(filesId);
        await this.fileService.delete(user, filesId);

        return folderRepository.delete<FolderEntity>(FolderEntity, {
          userId: user.id,
          id: In(fullFolders),
        });
      },
    );
  }
}
