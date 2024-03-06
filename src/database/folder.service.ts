import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  type FindOneOptions,
  type FindManyOptions,
  DeleteResult,
  In,
} from 'typeorm';

import { administratorFolderId, administratorFolderName } from '@/constants';
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
      ? TypeOrmFind.findCI(
          this.folderRepository,
          TypeOrmFind.findParams(FolderEntity, find),
        )
      : this.folderRepository.find(TypeOrmFind.findParams(FolderEntity, find));
  }

  async findAndCount(
    find: FindManyOptions<FolderEntity>,
    caseInsensitive = true,
  ): Promise<[FolderEntity[], number]> {
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(
          this.folderFilenumberRepository,
          TypeOrmFind.findParams(FolderFileNumberEntity, find),
        )
      : this.folderFilenumberRepository.findAndCount(
          TypeOrmFind.findParams(FolderFileNumberEntity, find),
        );
  }

  async findOne(
    find: FindOneOptions<FolderEntity>,
  ): Promise<FolderEntity | null> {
    return this.folderFilenumberRepository.findOne(
      TypeOrmFind.findParams(FolderFileNumberEntity, find),
    );
  }

  async rootFolder(user: UserEntity): Promise<FolderEntity> {
    const { id: userId } = user;

    let folder = await this.folderRepository.findOne({
      where: { name: '<Корень>', userId },
    });

    if (!folder) {
      folder = await this.create({
        name: '<Корень>',
        parentFolderId: null,
        userId,
      });
    }

    return folder;
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

    if (!folder) {
      return this.create({
        name: '<Исполненные>',
        parentFolderId: rootFolder.id,
        userId: user.id,
      });
    }

    return folder;
  }

  async administratorFolder(user: UserEntity): Promise<FolderEntity> {
    const parentFolder = await this.rootFolder(user);

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
      throw new NotFoundException('Error when creating folder');
    }
    const { id } = inserted.identifiers[0];

    const find = await this.folderRepository.findOne({ where: { id } });
    if (!find) {
      throw new NotFoundException('Error when creating folder');
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
      throw new NotFoundException('Error when updating folder');
    }

    const find = await this.folderRepository.findOne({ where: { id } });
    if (!find) {
      throw new NotFoundException('Error when updating folder');
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

        await this.fileService.copy(userId, folderCopy, folder.files);

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
      const filesId = await this.fileService
        .find({
          find: {
            where: { folderId: In(fullFolders) },
            relations: {},
            loadEagerRelations: false,
            select: ['id', 'folderId', 'name', 'hash'],
          },
          caseInsensitive: false,
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
