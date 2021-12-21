import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { Response as ExpressResponse } from 'express';
import { PromiseResult } from 'aws-sdk/lib/request';
import {
  BadRequestException,
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
import { FileCategory, VideoType } from '@/enums';
import { FileUploadRequest } from '@/dto';
import { getS3Name } from '@/shared/get-name';
import { FileEntity, MediaMeta } from './file.entity';
import { FolderService } from './folder.service';
import { UserEntity } from './user.entity';
import { MonitorService } from './monitor.service';
import { MonitorEntity } from './monitor.entity';

@Injectable()
export class FileService {
  private logger = new Logger(FileService.name);

  public bucket: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly folderService: FolderService,
    private readonly monitorService: MonitorService,
    @InjectS3()
    private readonly s3Service: S3,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {
    this.bucket = configService.get('AWS_BUCKET', 'myscreen-media');
  }

  /**
   * Get files
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {[FileEntity[], number]} Результат
   */
  find = async (
    find: FindManyOptions<FileEntity>,
  ): Promise<[FileEntity[], number]> =>
    this.fileRepository.findAndCount({
      ...find,
      loadRelationIds: {
        relations: ['monitors'],
      },
    });

  /**
   * Get file
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {FileEntity} Результат
   */
  findOne = async (
    find: FindManyOptions<FileEntity>,
  ): Promise<FileEntity | undefined> =>
    this.fileRepository.findOne({
      ...find,
      loadRelationIds: {
        relations: ['monitors'],
      },
    });

  /**
   * Update file
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {FileEntity} Результат
   */
  @Transaction()
  async update(
    fileEntity: FileEntity,
    update: Partial<FileEntity>,
    @TransactionRepository(FileEntity)
    fileRepository?: Repository<FileEntity>,
  ): Promise<FileEntity | undefined> {
    if (update.folderId !== fileEntity.folderId) {
      const s3Name = getS3Name(fileEntity.originalName);
      const Key = `${update.folderId}/${fileEntity.hash}-${s3Name}`;
      const CopySource = `${fileEntity.folderId}/${fileEntity.hash}-${s3Name}`;

      return Promise.all([
        fileRepository?.save(fileRepository?.create(update)),
        this.s3Service
          .copyObject({
            Bucket: this.bucket,
            Key,
            CopySource: `${this.bucket}/${CopySource}`,
            MetadataDirective: 'REPLACE',
          })
          .promise()
          .then(() =>
            this.s3Service
              .deleteObject({ Bucket: this.bucket, Key: CopySource })
              .promise()
              .catch((error) => {
                this.logger.error('S3 Error deleteObject:', error);
                throw new Error(error);
              }),
          )
          .catch((error) => {
            this.logger.error('S3 Error copyObject:', error);
            throw new Error(error);
          }),
      ]).then(([updated]) => updated);
    }

    return fileRepository?.save(this.fileRepository.create(update));
  }

  /**
   * Upload files
   * @async
   * @param {UserEntity} user
   * @param {string} folderId
   * @param {Array<Express.Multer.File>} files
   */
  @Transaction()
  async upload(
    user: UserEntity,
    { folderId, category, monitorId }: FileUploadRequest,
    files: Array<Express.Multer.File>,
    @TransactionRepository(FileEntity)
    fileRepository?: Repository<FileEntity>,
  ): Promise<[Array<FileEntity>, number]> {
    const folder = await this.folderService.findOne({
      where: { userId: user.id, id: folderId },
    });
    if (!folder) {
      throw new NotFoundException(`Folder '${folderId}' not found`);
    }

    let monitor: MonitorEntity | undefined;
    if (!monitorId && category !== FileCategory.Media) {
      throw new NotFoundException('monitorId is expected');
    }
    if (monitorId && category === FileCategory.Media) {
      throw new NotFoundException("Found category: 'media' and monitorId");
    }
    if (monitorId) {
      monitor = await this.monitorService.findOne({
        where: { userId: user.id, id: monitorId },
      });
      if (!monitor) {
        throw new NotFoundException(`Monitor '${monitorId}' not found`);
      }
    }
    if (!monitor && category !== FileCategory.Media) {
      throw new NotFoundException('monitorId is expected');
    }
    if (monitor && category === FileCategory.Media) {
      throw new NotFoundException("Found category: 'media' and monitorId");
    }

    const filesPromises = files.flatMap((file) => {
      const [meta, videoType, extension] = this.metaInformation(file, category);

      const media: DeepPartial<FileEntity> = {
        userId: user.id,
        folderId,
        originalName: file.originalname,
        name: file.originalname,
        filesize: meta.filesize,
        meta,
        videoType,
        category,
        extension,
        hash: file.hash,
        // TODO: доделать preview
        preview: [],
        monitors: [{ id: monitorId }],
      };

      const Key = `${folderId}/${file.hash}-${getS3Name(file.originalname)}`;
      return [
        fileRepository?.save(this.fileRepository.create(media)),
        this.s3Service
          .upload({
            Bucket: this.bucket,
            Key,
            ContentType: file.mimetype,
            Body: createReadStream(file.path),
          })
          .promise()
          .catch((error) => {
            this.logger.error('S3 Error: upload', error);
            throw new ServiceUnavailableException(error);
          }),
      ];
    });

    const errors: Array<Error> = [];
    let count = 0;
    const returnFiles = await Promise.allSettled(filesPromises).then((data) =>
      data.reduce((results, result) => {
        if (result.status === 'fulfilled') {
          if (
            result.value instanceof FileEntity &&
            Array.isArray(Object.keys(result.value))
          ) {
            count += 1;
            return results.concat(result.value);
          }
          return results;
        }

        errors.push(result.reason);
        return results;
      }, [] as Array<FileEntity>),
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

    return [returnFiles, count];
  }

  /**
   * Get file from S3
   * @async
   * @param {ExpressRequest} request
   * @param {UserEntity} user
   * @param {string} id
   */
  async getFileS3(
    response: ExpressResponse,
    user: UserEntity,
    id: string,
  ): Promise<PromiseResult<AWS.S3.GetObjectOutput, AWS.AWSError>> {
    const file = await this.fileRepository.findOne({
      where: { userId: user.id, id },
    });
    if (!file) {
      throw new NotFoundException(`File '${id}' is not exists`);
    }

    const Key = `${file.folderId}/${file.hash}-${getS3Name(file.originalName)}`;
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
        this.logger.error(error, FileService.name);
      })
      .promise();
  }

  /**
   * TODO: Get file preview from S3
   * @async
   * @param {ExpressRequest} request
   * @param {UserEntity} user
   * @param {string} id
   */
  async getFilePreviewS3(
    response: ExpressResponse,
    user: UserEntity,
    id: string,
  ): Promise<PromiseResult<AWS.S3.GetObjectOutput, AWS.AWSError>> {
    const file = await this.fileRepository.findOne({
      where: { userId: user.id, id },
    });

    if (!file) {
      throw new NotFoundException(`File '${id}' is not exists`);
    }

    // TODO: check file preview

    const Key = `${file.folderId}/${file.hash}-${getS3Name(file.originalName)}`;
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
        this.logger.error(error, FileService.name);
      })
      .promise();
  }

  /**
   * Delete files
   * @async
   * @param {UserEntity} user
   * @param {string} id
   */
  @Transaction()
  async delete(
    user: UserEntity,
    id: string,
    @TransactionRepository(FileEntity)
    fileRepository: Repository<FileEntity> = this.fileRepository,
  ): Promise<FileEntity> {
    const file = await fileRepository.findOne({
      where: { userId: user.id, id },
    });
    if (!file) {
      throw new NotFoundException(`Media '${id}' is not exists`);
    }

    const Key = `${file.folderId}/${file.hash}-${getS3Name(file.originalName)}`;
    await this.s3Service
      .headObject({
        Bucket: this.bucket,
        Key,
      })
      .promise()
      .then(() =>
        this.s3Service
          .deleteObject({ Bucket: this.bucket, Key })
          .promise()
          .catch((error) => {
            this.logger.error('S3 Error deleteObject:', error);
          }),
      )
      .catch((error) => {
        this.logger.error('S3 Error headerObject:', error);
      });

    return fileRepository.remove(file);
  }

  /**
   * Meta information
   * @param {Express.Multer.File} file The file
   * @return {[MediaMeta, VideoType]} [MediaMeta, VideType]
   */
  metaInformation = (
    file: Express.Multer.File,
    category: FileCategory,
  ): [MediaMeta, VideoType, string] => {
    const [mime] = file.mimetype.split('/');
    const extension = file.originalname.slice(
      file.originalname.lastIndexOf('.') + 1,
    );
    const type =
      Object.values(VideoType).find((t) => t === mime) ?? VideoType.Other;

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

      return [meta, type, extension];
    }

    if (category === FileCategory.Media) {
      throw new BadRequestException(
        `'${file.originalname}' has no media property, but the category specified 'media'`,
      );
    }

    return [{ filesize: file.size }, type, extension];
  };
}
