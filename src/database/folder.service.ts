import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DeleteResult,
  In,
  EntityManager,
  IsNull,
  Not,
} from 'typeorm';

import { NotFoundError } from '@/errors';
import {
  administratorFolderId,
  administratorFolderName,
  exportFolderName,
  invoiceFolderName,
  monitorFolderName,
  otherFolderId,
  otherFolderName,
  rootFolderName,
} from '@/constants';
import { FindManyOptionsExt, FindOneOptionsExt } from '@/interfaces';
import { UserRoleEnum } from '@/enums';
import { FolderResponse } from '@/dto';
import { getFullName } from '@/utils/full-name';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { FileService } from '@/database/file.service';
import { FolderEntity } from './folder.entity';
import { FolderExtView } from './folder-ext.view';
import { FileEntity } from './file.entity';
import { UserEntity } from './user.entity';
import { FileExtView } from './file-ext.view';

@Injectable()
export class FolderService {
  private logger = new Logger(FolderService.name);

  constructor(
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FolderEntity)
    private readonly folderRepository: Repository<FolderEntity>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(FileExtView)
    private readonly fileExtRepository: Repository<FileExtView>,
    @InjectRepository(FolderExtView)
    private readonly folderExtRepository: Repository<FolderExtView>,
  ) {}

  async find({
    caseInsensitive = true,
    transact: _transact,
    ...find
  }: FindManyOptionsExt<FolderEntity>): Promise<FolderExtView[]> {
    const transact = _transact
      ? _transact.withRepository(this.folderExtRepository)
      : this.folderExtRepository;

    return !caseInsensitive
      ? transact.find(TypeOrmFind.findParams<FolderExtView>(FolderEntity, find))
      : TypeOrmFind.findCI(
          transact,
          TypeOrmFind.findParams<FolderExtView>(FolderEntity, find),
        );
  }

  async findAndCount({
    caseInsensitive = true,
    ...find
  }: FindManyOptionsExt<FolderEntity>): Promise<[FolderExtView[], number]> {
    const transact = find.transact
      ? find.transact.withRepository(this.folderExtRepository)
      : this.folderExtRepository;

    return !caseInsensitive
      ? transact.findAndCount(
          TypeOrmFind.findParams<FolderExtView>(FolderEntity, find),
        )
      : TypeOrmFind.findAndCountCI<FolderExtView>(
          transact,
          TypeOrmFind.findParams(FolderEntity, find),
        );
  }

  async findOne({
    caseInsensitive = true,
    transact,
    ...find
  }: FindOneOptionsExt<FolderEntity>): Promise<FolderExtView | null> {
    const _transact = transact
      ? transact.withRepository(this.folderExtRepository)
      : this.folderExtRepository;

    return !caseInsensitive
      ? _transact.findOne(
          TypeOrmFind.findParams<FolderExtView>(FolderEntity, find),
        )
      : TypeOrmFind.findOneCI(
          _transact,
          TypeOrmFind.findParams<FolderExtView>(FolderEntity, find),
        );
  }

  async rootFolder(
    userId: string,
    transact?: EntityManager,
  ): Promise<FolderEntity> {
    const _transact = transact
      ? transact.withRepository(this.folderRepository)
      : this.folderRepository;

    let folder = await _transact.findOne({
      where: { parentFolder: IsNull(), userId },
    });

    if (!folder) {
      folder = await this.create(
        {
          name: rootFolderName,
          parentFolder: null,
          userId,
          system: true,
        },
        transact,
      );
    }

    return folder;
  }

  async exportFolder(
    userId: string,
    transact?: EntityManager,
  ): Promise<FolderEntity> {
    const { id: parentFolderId } = await this.rootFolder(userId, transact);

    const folder = await this.findOne({
      where: {
        name: exportFolderName,
        parentFolderId,
        system: true,
        userId,
      },
      caseInsensitive: false,
      transact,
    });

    if (!folder) {
      return this.create(
        {
          name: exportFolderName,
          parentFolderId,
          system: true,
          userId,
        },
        transact,
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
        name: invoiceFolderName,
        parentFolderId,
        system: true,
        userId,
      },
      caseInsensitive: false,
      transact,
    });

    if (!folder) {
      return this.create(
        {
          name: invoiceFolderName,
          parentFolderId,
          userId,
          system: true,
        },
        transact,
      );
    }

    return folder;
  }

  async monitorFolder(
    userId: string,
    transact?: EntityManager,
  ): Promise<FolderEntity> {
    const { id: parentFolderId } = await this.rootFolder(userId, transact);

    const folder = await this.findOne({
      where: {
        name: monitorFolderName,
        parentFolderId,
        userId,
        system: true,
      },
      caseInsensitive: false,
      transact,
    });

    if (!folder) {
      return this.create(
        {
          name: monitorFolderName,
          parentFolderId,
          userId,
          system: true,
        },
        transact,
      );
    }

    return folder;
  }

  async administratorFolder(
    userId: string,
    transact?: EntityManager,
  ): Promise<FolderEntity> {
    const parentFolder = await this.rootFolder(userId, transact);

    return {
      id: administratorFolderId,
      name: administratorFolderName,
      parentFolderId: parentFolder.id,
      system: true,
    } as FolderEntity;
  }

  async otherUserFoldersName({
    role,
    id: userId,
  }: UserEntity): Promise<FolderResponse[]> {
    if (role === UserRoleEnum.Administrator) {
      const users = await this.userRepository.find({
        where: {
          id: Not(userId),
          verified: true,
          disabled: false,
        },
        select: ['id', 'name', 'surname', 'middleName', 'email'],
        loadEagerRelations: false,
        relations: {},
      });
      return users.map((user) => ({
        id: otherFolderId.replace(/%/, user.id.slice(24)),
        name: otherFolderName.replace(/%/, getFullName(user)),
        system: true,
        userId: user.id,
        parentFolderId: administratorFolderId,
      }));
    }
    return [];
  }

  async otherUserFolders(userId: string): Promise<FolderResponse[]> {
    const folders = await this.folderRepository.find({
      where: { system: true, userId: Not(userId) },
      loadEagerRelations: false,
      relations: {},
    });
    return folders;
  }

  async create(
    folder: Partial<FolderEntity>,
    transact?: EntityManager,
  ): Promise<FolderEntity> {
    const _transact = transact
      ? transact.withRepository(this.folderRepository)
      : this.folderRepository;

    const created = await _transact.save(folder);
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
