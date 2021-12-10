import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';

import { MediaEntity } from './media.entity';
import { FolderService } from './folder.service';
import { UserEntity } from './user.entity';

@Injectable()
export class MediaService {
  private logger = new Logger(MediaService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly folderService: FolderService,
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
  ) {}

  /**
   * Get media files
   *
   * @async
   * @param {MediaGetFilesRequest} body
   * @returns {MediaGetFilesResponse} Результат
   */
  getMediaFiles = async (
    find: FindManyOptions<MediaEntity>,
  ): Promise<[MediaEntity[], number]> =>
    this.mediaRepository.findAndCount(find);

  /**
   * File name
   * @param {Express.Request} req
   * @param {Express.Multer.File} file
   */
  filename = async (
    req: Express.Request,
    file: Express.Multer.File,
  ): Promise<string> => {
    // eslint-disable-next-line
    debugger;

    // TODO:
    return file.originalname;
  };

  /**
   * Content type
   * @param {Express.Request} req
   * @param {Express.Multer.File} file
   */
  contentType = async (
    req: Express.Request,
    file: Express.Multer.File,
  ): Promise<string> => {
    const [type] = file.mimetype.split('/');

    return type;
  };

  /**
   * Upload media files
   * @async
   * @param {UserEntity} user
   * @param {string} name
   * @param {string} folderId
   * @param {Express.Multer.File} file
   */
  upload = async (
    user: UserEntity,
    name: string,
    folderId: string,
    file: Express.Multer.File,
  ): Promise<[MediaEntity, number]> => {
    // eslint-disable-next-line
    debugger;

    throw new NotImplementedException();
  };
}
