import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  type FindOneOptions,
  type FindManyOptions,
  DeleteResult,
  In,
} from 'typeorm';

import { TypeOrmFind } from '@/shared/typeorm.find';
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

  async rootFolder(userId: string): Promise<FolderEntity> {
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

  async copy(userId: string, folders: FolderEntity[]): Promise<FolderEntity[]> {
    return this.folderRepository.manager.transaction(
      async (folderRepository) => {
        throw new NotImplementedException();
      },
    );
  }

  async delete(userId: string, foldersId: string[]): Promise<DeleteResult> {
    return this.folderRepository.manager.transaction(
      async (folderRepository) => {
        const folderSubId = await folderRepository
          .find<FolderEntity>(FolderEntity, {
            where: { userId, parentFolderId: In(foldersId) },
            relations: [],
            loadEagerRelations: false,
            select: ['id'],
          })
          .then((folders) => folders.map((folder) => folder.id));

        const fullFolders = [...foldersId, ...folderSubId];
        const filesId = await this.fileService
          .find({
            where: { userId, folderId: In(fullFolders) },
            relations: [],
            loadEagerRelations: false,
            select: ['id'],
          })
          .then((files) => files.map((file) => file.id));
        await this.fileService.deletePrep(filesId);
        await this.fileService.delete(userId, filesId);

        return folderRepository.delete<FolderEntity>(FolderEntity, {
          userId,
          id: In(fullFolders),
        });
      },
    );
  }
}
