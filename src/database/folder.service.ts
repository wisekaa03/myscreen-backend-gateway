import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, In, EntityManager, IsNull } from 'typeorm';

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
    const transact = find.transact
      ? find.transact.withRepository(this.folderFilenumberRepository)
      : this.folderFilenumberRepository;

    return !find.caseInsensitive
      ? transact.find(TypeOrmFind.findParams(FolderEntity, find))
      : TypeOrmFind.findCI(
          transact,
          TypeOrmFind.findParams(FolderEntity, find),
        );
  }

  async findAndCount(
    find: FindManyOptionsCaseInsensitive<FolderEntity>,
  ): Promise<[FolderEntity[], number]> {
    const transact = find.transact
      ? find.transact.withRepository(this.folderFilenumberRepository)
      : this.folderFilenumberRepository;

    return !find.caseInsensitive
      ? transact.findAndCount(
          TypeOrmFind.findParams(FolderFileNumberEntity, find),
        )
      : TypeOrmFind.findAndCountCI(
          transact,
          TypeOrmFind.findParams(FolderFileNumberEntity, find),
        );
  }

  async findOne(
    find: FindOneOptionsCaseInsensitive<FolderEntity>,
  ): Promise<FolderEntity | null> {
    const transact = find.transact
      ? find.transact.withRepository(this.folderFilenumberRepository)
      : this.folderFilenumberRepository;

    return !find.caseInsensitive
      ? transact.findOne(TypeOrmFind.findParams(FolderFileNumberEntity, find))
      : TypeOrmFind.findOneCI(
          transact,
          TypeOrmFind.findParams(FolderFileNumberEntity, find),
        );
  }

  async rootFolder(
    userId: string,
    _transact?: EntityManager,
  ): Promise<FolderEntity> {
    const transact = _transact
      ? _transact.withRepository(this.folderRepository)
      : this.folderRepository;

    let folder = await transact.findOne({
      where: { parentFolder: IsNull(), userId },
    });

    if (!folder) {
      folder = await this.create(
        {
          name: '<Корень>',
          parentFolder: null,
          userId,
        },
        _transact,
      );
    }

    return folder;
  }

  async exportFolder(
    userId: string,
    _transact?: EntityManager,
  ): Promise<FolderEntity> {
    const { id: parentFolderId } = await this.rootFolder(userId, _transact);

    const folder = await this.findOne({
      where: {
        name: '<Исполненные>',
        parentFolderId,
        userId,
      },
      caseInsensitive: false,
      transact: _transact,
    });

    if (!folder) {
      return this.create(
        {
          name: '<Исполненные>',
          parentFolderId,
          userId,
        },
        _transact,
      );
    }

    return folder;
  }

  async invoiceFolder(
    userId: string,
    transact?: EntityManager,
  ): Promise<FolderEntity> {
    const { id: parentFolderId } = await this.rootFolder(userId, transact);

    const folder = await this.findOne({
      where: {
        name: '<Счета>',
        parentFolderId,
        userId,
      },
      caseInsensitive: false,
      transact,
    });

    if (!folder) {
      return this.create(
        {
          name: '<Счета>',
          parentFolderId,
          userId,
        },
        transact,
      );
    }

    return folder;
  }

  async monitorFolder(
    userId: string,
    _transact?: EntityManager,
  ): Promise<FolderEntity> {
    const { id: parentFolderId } = await this.rootFolder(userId, _transact);

    const folder = await this.findOne({
      where: {
        name: '<Мониторы>',
        parentFolderId,
        userId,
      },
      caseInsensitive: false,
      transact: _transact,
    });

    if (!folder) {
      return this.create(
        {
          name: '<Мониторы>',
          parentFolderId,
          userId,
        },
        _transact,
      );
    }

    return folder;
  }

  async administratorFolder(
    userId: string,
    _transact?: EntityManager,
  ): Promise<FolderEntity> {
    const parentFolder = await this.rootFolder(userId, _transact);

    return {
      id: administratorFolderId,
      name: administratorFolderName,
      parentFolderId: parentFolder.id,
    } as FolderEntity;
  }

  async create(
    folder: Partial<FolderEntity>,
    _transact?: EntityManager,
  ): Promise<FolderEntity> {
    const transact = _transact
      ? _transact.withRepository(this.folderRepository)
      : this.folderRepository;

    const created = await transact.save(folder);
    if (!created) {
      throw new NotFoundError('Error when creating folder');
    }

    return created;
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
    return this.folderRepository.manager.transaction(
      'REPEATABLE READ',
      async (transact) => {
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
          const folderCopy = await transact.save(
            FolderEntity,
            folderCopyCreate,
          );

          await this.fileService.copy(
            userId,
            folderCopy,
            folder.files,
            transact,
          );

          return folderCopy;
        });

        return Promise.all(foldersPromise);
      },
    );
  }

  async delete(foldersId: string[]): Promise<DeleteResult> {
    return this.folderRepository.manager.transaction(
      'REPEATABLE READ',
      async (transact) => {
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
      },
    );
  }
}
