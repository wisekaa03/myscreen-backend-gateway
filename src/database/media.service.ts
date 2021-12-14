import { createReadStream } from 'node:fs';
import { resolve as pathResolve } from 'node:path';
import { Readable } from 'node:stream';
import { Response as ExpressResponse } from 'express';
import { PromiseResult } from 'aws-sdk/lib/request';
import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
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

import { isAWSError } from '@/shared/is-aws-error';
import { MediaEntity, MediaMeta } from './media.entity';
import { FolderService } from './folder.service';
import { UserEntity } from './user.entity';
import { VideoType } from './enums/video-type.enum';

@Injectable()
export class MediaService {
  private logger = new Logger(MediaService.name);

  public bucket: string;

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
   * @param {FindManyOptions<MediaEntity>} find
   * @returns {[MediaEntity[], number]} Результат
   */
  getMediaFiles = async (
    find: FindManyOptions<MediaEntity>,
  ): Promise<[MediaEntity[], number]> =>
    this.mediaRepository.findAndCount(find);

  /**
   * Get media file
   *
   * @async
   * @param {FindManyOptions<MediaEntity>} find
   * @returns {MediaEntity} Результат
   */
  getMediaFile = async (
    find: FindManyOptions<MediaEntity>,
  ): Promise<MediaEntity | undefined> => this.mediaRepository.findOne(find);

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
      throw new NotFoundException(`Folder ${folderId} not found`);
    }

    const filesPromises = files.flatMap((file) => {
      const [meta, type] = this.metaInformation(file);

      const media: DeepPartial<MediaEntity> = {
        userId: user.id,
        folderId,
        originalName: file.originalname,
        name: file.originalname,
        meta,
        type,
        hash: file.hash,
      };

      return [
        mediaRepository?.save(this.mediaRepository.create(media)),
        this.s3Service
          .upload({
            Bucket: this.bucket,
            Key: `${folderId}/${file.hash}-${file.originalname}`,
            ContentType: file.mimetype,
            Body: createReadStream(
              pathResolve(__dirname, '../../..', file.path),
            ),
          })
          .promise()
          .catch((error) => {
            this.logger.error('S3 Error: upload', error);
            throw new ServiceUnavailableException(error);
          }),
      ];
    });

    const errors: Array<unknown> = [];
    const returnFiles = await Promise.allSettled(filesPromises).then((data) =>
      data.reduce((results, result) => {
        if (result.status === 'fulfilled') {
          if (
            result.value instanceof MediaEntity &&
            Array.isArray(Object.keys(result.value))
          ) {
            return results.concat(result.value);
          }
          return results;
        }

        errors.push(result.reason);
        return results;
      }, [] as Array<MediaEntity>),
    );

    if (errors.length > 0) {
      const message: Array<string> = [];

      errors.forEach((error: unknown) => {
        if (isAWSError(error)) {
          this.logger.error(error.code, error.stack);
          message.push(error.message);
        } else if (error instanceof Error) {
          this.logger.error(error, error.stack);
          message.push(error.message);
        } else {
          this.logger.error(error);
          message.push((error as string)?.toString());
        }
      });

      throw new ServiceUnavailableException(
        `Can't upload on S3: ${message.join(', ')}`,
      );
    }

    return returnFiles;
  }

  /**
   * Get media file from S3
   * @async
   * @param {ExpressRequest} request
   * @param {UserEntity} user
   * @param {string} id
   */
  async getMediaFileS3(
    response: ExpressResponse,
    user: UserEntity,
    id: string,
  ): Promise<PromiseResult<AWS.S3.GetObjectOutput, AWS.AWSError>> {
    const media = await this.mediaRepository.findOne({
      where: { user, id },
    });

    if (!media) {
      throw new NotFoundException(`Media '${id}' is not exists`);
    }

    const Key = `${media.folderId}/${media.hash}-${media.originalName}`;
    return this.s3Service
      .getObject({
        Bucket: this.bucket,
        Key,
      })
      .on(
        'httpHeaders',
        (
          statusCode: number,
          headers: { [key: string]: string },
          awsResponse: AWS.Response<AWS.S3.Types.GetObjectOutput, AWS.AWSError>,
        ) => {
          if (statusCode === 200) {
            response.setHeader('Content-Length', headers['content-length']);
            response.setHeader('Content-Type', headers['content-type']);
            response.setHeader('Last-Modified', headers['last-modified']);
            if (!response.headersSent) {
              response.flushHeaders();
            }
            (
              awsResponse.httpResponse.createUnbufferedStream() as Readable
            ).pipe(response);
          }
        },
      )
      .on('error', (error) => {
        this.logger.error(error, MediaService.name);
      })
      .promise();
  }

  /**
   * Delete media files
   * @async
   * @param {UserEntity} user
   * @param {string} id
   */
  @Transaction()
  async delete(
    user: UserEntity,
    id: string,
    @TransactionRepository(MediaEntity)
    mediaRepository: Repository<MediaEntity> = this.mediaRepository,
  ): Promise<MediaEntity> {
    const media = await mediaRepository.findOne({
      where: { user, id },
    });

    if (!media) {
      throw new NotFoundException(`Media '${id}' is not exists`);
    }

    const Key = `${media.folderId}/${media.hash}-${media.originalName}`;
    const s3media = await this.s3Service
      .headObject({
        Bucket: this.bucket,
        Key,
      })
      .promise()
      .catch((error: string) => {
        this.logger.error('S3 Error: headObject', error);
      });

    if (s3media) {
      await this.s3Service
        .deleteObject({ Bucket: this.bucket, Key })
        .promise()
        .catch((error: string) => {
          this.logger.error('S3 Error: deleteObject', error);
        });
    }

    return mediaRepository.remove(media);
  }

  /**
   * Meta information
   * @param {Express.Multer.File} file The file
   * @return {[MediaMeta, VideoType]} [MediaMeta, VideType]
   */
  metaInformation = (file: Express.Multer.File): [MediaMeta, VideoType] => {
    const [mime] = file.mimetype.split('/');
    const type =
      Object.values(VideoType).find((t) => t === mime) ?? VideoType.Image;

    if (file?.media) {
      const {
        media: { format: mediaFormat, streams },
      } = file;
      const { filename, ...format } = mediaFormat ?? {};
      const meta: MediaMeta = {
        filesize: Number(file.media.format?.size) || file.size,
        duration: Number(file.media.format?.duration),
        width:
          Number(file.media.format?.width) ||
          Number(file.media.streams?.[0].width) ||
          undefined,
        height:
          Number(file.media.format?.height) ||
          file.media.streams?.[0].height ||
          undefined,
        info: {
          format,
          streams,
        },
      };

      return [meta, type];
    }

    return [{ filesize: file.size }, type];
  };
}
