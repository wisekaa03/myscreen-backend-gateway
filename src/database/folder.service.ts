import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, In } from 'typeorm';

import { NotFoundError } from '@/errors';
import { administratorFolderId, administratorFolderName } from '@/constants';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { FileService } from '@/database/file.service';
import { FolderEntity } from './folder.entity';
import { FolderFileNumberEntity } from './folder.view.entity';
import {
  FindManyOptionsCaseInsensitive,
  FindOneOptionsCaseInsensitive,
} from '@/interfaces';
import { FileEntity } from './file.entity';

@Injectable()
export class FolderService {
  private logger = new Logger(FolderService.name);

  constructor(
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @InjectRepository(FolderEntity)
    private readonly folderRepository: Repository<FolderEntity>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(FolderFileNumberEntity)
    private readonly folderFilenumberRepository: Repository<FolderFileNumberEntity>,
  ) {}

  async find(
    find: FindManyOptionsCaseInsensitive<FolderEntity>,
  ): Promise<FolderEntity[]> {
    return !find.caseInsensitive
      ? this.folderRepository.find(TypeOrmFind.findParams(FolderEntity, find))
      : TypeOrmFind.findCI(
          this.folderRepository,
          TypeOrmFind.findParams(FolderEntity, find),
        );
  }

  async findAndCount(
    find: FindManyOptionsCaseInsensitive<FolderEntity>,
  ): Promise<[FolderEntity[], number]> {
    return !find.caseInsensitive
      ? this.folderFilenumberRepository.findAndCount(
          TypeOrmFind.findParams(FolderFileNumberEntity, find),
        )
      : TypeOrmFind.findAndCountCI(
          this.folderFilenumberRepository,
          TypeOrmFind.findParams(FolderFileNumberEntity, find),
        );
  }

  async findOne(
    find: FindOneOptionsCaseInsensitive<FolderEntity>,
  ): Promise<FolderEntity | null> {
    return !find.caseInsensitive
      ? this.folderFilenumberRepository.findOne(
          TypeOrmFind.findParams(FolderFileNumberEntity, find),
        )
      : TypeOrmFind.findOneCI(
          this.folderFilenumberRepository,
          TypeOrmFind.findParams(FolderFileNumberEntity, find),
        );
  }

  async rootFolder(userId: string): Promise<FolderEntity> {
    let folder = await this.folderRepository.findOne({
      where: { name: '<Корень>', userId },
    });

    if (!folder) {
      folder = await this.create({
        name: '<Корень>',
        userId,
      });
    }

    return folder;
  }

  async exportFolder(userId: string): Promise<FolderEntity> {
    const { id: parentFolderId } = await this.rootFolder(userId);

    const folder = await this.findOne({
      where: {
        name: '<Исполненные>',
        parentFolderId,
        userId,
      },
    });

    if (!folder) {
      return this.create({
        name: '<Исполненные>',
        parentFolderId,
        userId,
      });
    }

    return folder;
  }

  async invoiceFolder(userId: string): Promise<FolderEntity> {
    const { id: parentFolderId } = await this.rootFolder(userId);

    const folder = await this.findOne({
      where: {
        name: '<Счета>',
        parentFolderId,
        userId,
      },
    });

    if (!folder) {
      return this.create({
        name: '<Счета>',
        parentFolderId,
        userId,
      });
    }

    return folder;
  }

  async monitorFolder(userId: string): Promise<FolderEntity> {
    const { id: parentFolderId } = await this.rootFolder(userId);

    const folder = await this.findOne({
      where: {
        name: '<Мониторы>',
        parentFolderId,
        userId,
      },
    });

    if (!folder) {
      return this.create({
        name: '<Мониторы>',
        parentFolderId,
        userId,
      });
    }

    return folder;
  }

  async administratorFolder(userId: string): Promise<FolderEntity> {
    const parentFolder = await this.rootFolder(userId);

    return {
      id: administratorFolderId,
      name: administratorFolderName,
      parentFolderId: parentFolder.id,
    } as FolderEntity;
  }

  async create(folder: Partial<FolderEntity>): Promise<FolderEntity> {
    const inserted = await this.folderRepository.insert(
      this.folderRepository.create(folder),
    );
    if (!inserted.identifiers[0]) {
      throw new NotFoundError('Error when creating folder');
    }
    const { id } = inserted.identifiers[0];

    const find = await this.folderRepository.findOne({ where: { id } });
    if (!find) {
      throw new NotFoundError('Error when creating folder');
    }

    return find;
  }

  async update(
    id: string,
    folder: Partial<FolderEntity>,
  ): Promise<FolderEntity> {
    const updated = await this.folderRepository.update(
      id,
      this.folderRepository.create(folder),
    );
    if (!updated.affected) {
      throw new NotFoundError('Error when updating folder');
    }

    const find = await this.folderRepository.findOne({ where: { id } });
    if (!find) {
      throw new NotFoundError('Error when updating folder');
    }

    return find;
  }

  async copy(
    userId: string,
    toFolder: FolderEntity,
    originalFolders: FolderEntity[],
  ): Promise<FolderEntity[]> {
    return this.folderRepository.manager.transaction(async (transact) => {
      const foldersPromise = originalFolders.map(async (folder) => {
        const folderCopyCreate = transact.create(FolderEntity, {
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
        const folderCopy = await transact.save(FolderEntity, folderCopyCreate);

        await this.fileService.copy(userId, folderCopy, folder.files, transact);

        return folderCopy;
      });

      return Promise.all(foldersPromise);
    });
  }

  async delete(foldersId: string[]): Promise<DeleteResult> {
    return this.folderRepository.manager.transaction(async (transact) => {
      const folderSubId = await transact
        .find(FolderEntity, {
          where: { parentFolderId: In(foldersId) },
          relations: [],
          loadEagerRelations: false,
          select: ['id'],
        })
        .then((folders) => folders.map((folder) => folder.id));

      const fullFolders = [...foldersId, ...folderSubId];
      const filesId = await this.fileRepository
        .find({
          where: { folderId: In(fullFolders) },
          relations: {},
          loadEagerRelations: false,
          select: ['id', 'folderId', 'name', 'hash'],
        })
        .then((files) => files.map((file) => file.id));
      await this.fileService.deletePrep(filesId);
      await this.fileService.delete(filesId);

      return transact.delete(FolderEntity, {
        id: In(fullFolders),
      });
    });
  }
}
