import { createReadStream } from 'node:fs';
import { resolve as pathResolve } from 'node:path';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectS3, S3 } from 'nestjs-s3';
import {
  Repository,
  FindManyOptions,
  DeepPartial,
  Transaction,
  TransactionRepository,
} from 'typeorm';

import { MediaEntity, MediaMeta } from './media.entity';
import { FolderService } from './folder.service';
import { UserEntity } from './user.entity';
import { VideoType } from './enums/video-type.enum';

@Injectable()
export class MediaService {
  private logger = new Logger(MediaService.name);

  private bucket: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly folderService: FolderService,
    @InjectS3()
    private readonly s3Service: S3,
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
  ) {
    this.bucket = configService.get('AWS_BUCKET', 'myscreen-video-editor');
  }

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
  @Transaction()
  async upload(
    user: UserEntity,
    folderId: string,
    files: Array<Express.Multer.File>,
    @TransactionRepository(MediaEntity)
    mediaRepository?: Repository<MediaEntity>,
  ): Promise<Array<MediaEntity>> {
    const folder = await this.folderService.findFolder({
      where: { user, id: folderId },
    });
    if (!folder) {
      throw new BadRequestException(`Folder ${folderId} not found`);
    }

    const filesPromises = files.flatMap((file) => {
      const [mime] = file.mimetype.split('/');
      const meta = this.metaInformation(file);

      const media: DeepPartial<MediaEntity> = {
        user,
        folder,
        originalName: file.originalname,
        name: file.filename,
        meta,
        hash: file.hash,
        type:
          Object.values(VideoType).find((type) => type === mime) ??
          VideoType.Image,
      };

      return [
        mediaRepository?.save(this.mediaRepository.create(media)),
        this.s3Service
          .upload({
            Bucket: this.bucket,
            Key: `${folder.id}/${file.filename}-${file.originalname}`,
            ContentType: file.mimetype,
            Body: createReadStream(
              pathResolve(__dirname, '../../..', file.path),
            ),
          })
          .promise(),
      ];
    });

    const errors: Array<unknown> = [];
    const returnFiles = await Promise.allSettled(filesPromises).then((data) =>
      data.reduce((results, result) => {
        if (result.status === 'fulfilled') {
          if (result.value instanceof MediaEntity && !result.value) {
            return results.concat(result.value);
          }
          return results;
        }

        errors.push(result.reason);
        return results;
      }, [] as MediaEntity[]),
    );

    if (errors.length > 0) {
      errors.forEach((error: unknown) => {
        if (error instanceof Error) {
          this.logger.error(error, error.stack);
        } else {
          this.logger.error(error);
        }
      });

      throw new BadRequestException("Can't load on S3");
    }

    return returnFiles;
  }

  /**
   * Meta information and hash
   * @param {Express.Multer.File} file The file
   * @return {[MediaMeta, string]} [MediaMeta, hash]
   */
  metaInformation = (file: Express.Multer.File): MediaMeta => ({
    duration: file.media?.format?.duration,
    filesize: file.size,
    meta: file.media,
  });
}
