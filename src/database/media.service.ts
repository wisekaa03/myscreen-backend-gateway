import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, DeepPartial } from 'typeorm';
import { randomUUID } from 'crypto';

import { MediaEntity, MediaMeta } from './media.entity';
import { FolderService } from './folder.service';
import { UserEntity } from './user.entity';
import { VideoType } from './enums/video-type.enum';

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
   * Upload media files
   * @async
   * @param {UserEntity} user
   * @param {string} folderId
   * @param {Array<Express.Multer.File>} files
   */
  upload = async (
    user: UserEntity,
    folderId: string,
    files: Array<Express.Multer.File>,
  ): Promise<Array<MediaEntity | undefined>> => {
    const folder = await this.folderService.findFolder({
      where: { user, id: folderId },
    });
    if (!folder) {
      throw new BadRequestException(`Folder ${folderId} not found`);
    }

    const filesPromises = files.flatMap(async (file) => {
      const [type] = file.mimetype.split('/');

      const meta = await this.metaInformation(file);

      const media: DeepPartial<MediaEntity> = {
        user,
        folder,
        originalName: file.originalname,
        name: file.filename,
        meta,
        hash: file.hash,
        type:
          Object.values(VideoType).find((t) => t === type) ?? VideoType.Image,
      };

      return {
        database: this.mediaRepository.save(this.mediaRepository.create(media)),
        // TODO
        s3: randomUUID(),
      };
    });

    const errors = [];
    const returnFiles = await Promise.allSettled(filesPromises)
      .then((data) =>
        data.map((result) => {
          if (result.status === 'fulfilled') {
            return result.value.database as unknown as MediaEntity;
          }

          errors.push(result.reason);
          return undefined;
        }),
      )
      .then((data) => data);

    return returnFiles;
  };

  /**
   * Meta information and hash
   * @async
   * @param {Express.Multer.File} file The file
   * @return {[MediaMeta, string]} [MediaMeta, hash]
   */
  metaInformation = async (file: Express.Multer.File): Promise<MediaMeta> => ({
    duration: file.media?.format?.duration,
    filesize: file.size,
    meta: file.media,
  });
}
