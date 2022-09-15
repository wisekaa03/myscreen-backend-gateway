import { createReadStream, promises as fs, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { join as pathJoin, parse as pathParse } from 'node:path';
import { PromiseResult } from 'aws-sdk/lib/request';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
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
  DeleteResult,
  In,
} from 'typeorm';

// import { isAWSError } from '@/shared/is-aws-error';
import { FileCategory, VideoType } from '@/enums';
import { ConflictData, FileUploadRequest } from '@/dto';
import { getS3Name } from '@/shared/get-name';
import { FfMpegPreview } from '@/shared/ffmpeg';
import { TypeOrmFind } from '@/shared/typeorm.find';
import { EditorService } from '@/database/editor.service';
import { FileEntity, MediaMeta } from './file.entity';
import { FilePreviewEntity } from './file-preview.entity';
import { FolderService } from './folder.service';
import { MonitorService } from './monitor.service';
import { MonitorEntity } from './monitor.entity';
import { FolderEntity } from './folder.entity';
import { PlaylistService } from './playlist.service';

@Injectable()
export class FileService {
  private logger = new Logger(FileService.name);

  private bucket: string;

  private region: string;

  private downloadDir: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => FolderService))
    private readonly folderService: FolderService,
    private readonly monitorService: MonitorService,
    @Inject(forwardRef(() => EditorService))
    private readonly editorService: EditorService,
    @Inject(forwardRef(() => PlaylistService))
    private readonly playlistService: PlaylistService,
    @InjectS3()
    private readonly s3Service: S3,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(FilePreviewEntity)
    private readonly filePreviewRepository: Repository<FilePreviewEntity>,
  ) {
    this.region = configService.get<string>('AWS_REGION', 'ru-central1');
    this.bucket = configService.get<string>('AWS_BUCKET', 'myscreen-media');
    this.downloadDir = configService.get<string>('FILES_UPLOAD', 'upload');
  }

  /**
   * Get files
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {Array<FileEntity>} {Array<FileEntity>} Результат
   */
  async find(
    find: FindManyOptions<FileEntity>,
    caseInsensitive = true,
  ): Promise<Array<FileEntity>> {
    const conditional = TypeOrmFind.Nullable(find);
    if (!find.relations) {
      conditional.relations = ['monitors', 'playlists'];
    }
    return caseInsensitive
      ? TypeOrmFind.findCI(this.fileRepository, conditional)
      : this.fileRepository.find(conditional);
  }

  /**
   * Get files
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {[Array<FileEntity>, number]} {[Array<FileEntity>, number]} Результат
   */
  async findAndCount(
    find: FindManyOptions<FileEntity>,
    caseInsensitive = true,
  ): Promise<[Array<FileEntity>, number]> {
    const conditional = TypeOrmFind.Nullable(find);
    if (!find.relations) {
      conditional.relations = ['monitors', 'playlists'];
    }
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(this.fileRepository, conditional)
      : this.fileRepository.findAndCount(conditional);
  }

  /**
   * Get file
   *
   * @async
   * @param {FindManyOptions<FileEntity>} find
   * @returns {FileEntity} {FileEntity | undefined} Результат
   */
  async findOne(find: FindManyOptions<FileEntity>): Promise<FileEntity | null> {
    return find.relations
      ? this.fileRepository.findOne(TypeOrmFind.Nullable(find))
      : this.fileRepository.findOne({
          relations: ['monitors', 'playlists'],
          ...TypeOrmFind.Nullable(find),
        });
  }

  /**
   * Update file
   *
   * @async
   * @param {FileEntity} file File repository
   * @param {Partial<FileEntity>} {Partial<FileEntity>} File repository
   * @returns {FileEntity | undefined} {FileEntity | undefined} Результат
   */
  async update(
    file: FileEntity,
    update: Partial<FileEntity>,
  ): Promise<FileEntity> {
    return this.fileRepository.manager.transaction(async (fileRepository) => {
      if (update.folderId !== undefined && update.folderId !== file.folder.id) {
        const s3Name = getS3Name(file.name);
        const Key = `${update.folderId}/${file.hash}-${s3Name}`;
        const CopySource = `${file.folder.id}/${file.hash}-${s3Name}`;

        /* await */ this.s3Service
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
              }),
          )
          .catch((error) => {
            this.logger.error('S3 Error copyObject:', error);
          });

        return fileRepository.save(
          fileRepository.create<FileEntity>(FileEntity, update),
        );
      }

      return fileRepository.save<FileEntity>(
        fileRepository.create<FileEntity>(FileEntity, {
          ...update,
          id: file.id,
        }),
      );
    });
  }

  /**
   * Upload files
   * @async
   * @param {string} userId User ID
   * @param {FileUploadRequest} {FileUploadRequest} File upload request
   * @param {Array<Express.Multer.File>} {Array<Express.Multer.File>} files The Express files
   */
  async upload(
    userId: string,
    {
      folderId: folderIdOrig = undefined,
      category = FileCategory.Media,
      monitorId = undefined,
    }: FileUploadRequest,
    files: Array<Express.Multer.File>,
  ): Promise<Array<FileEntity>> {
    return this.fileRepository.manager.transaction(async (fileRepository) => {
      let folder: FolderEntity | null = null;
      if (!folderIdOrig) {
        folder = await this.folderService.rootFolder(userId);
      } else {
        folder =
          (await this.folderService.findOne({
            where: { userId, id: folderIdOrig },
          })) ?? null;
        if (!folder) {
          throw new NotFoundException(`Folder '${folderIdOrig}' not found`);
        }
      }
      const folderId = folder.id;

      let monitor: MonitorEntity | null = null;
      if (!monitorId && category !== FileCategory.Media) {
        throw new NotFoundException('monitorId is expected');
      }
      if (monitorId && category === FileCategory.Media) {
        throw new NotFoundException("Found category: 'media' and monitorId");
      }
      if (monitorId) {
        monitor =
          (await this.monitorService.findOne(userId, {
            where: { userId, id: monitorId },
          })) ?? null;
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
      if (category === FileCategory.Media) {
        files.forEach((file) => {
          if (!file.media) {
            throw new BadRequestException(
              `'${file.originalname}' has no data in Ffprobe, but the category specified 'media'`,
            );
          }
        });
      }

      const filesPromises = files.map(async (file) => {
        const [meta, videoType, extension, preview] =
          await this.metaInformation(file);

        const media: DeepPartial<FileEntity> = {
          userId,
          folder: folder ?? undefined,
          name: file.originalname,
          filesize: meta.filesize,
          duration: meta.duration ?? 0,
          width: meta.width,
          height: meta.height,
          meta,
          videoType,
          category,
          extension,
          hash: file.hash,
          preview: undefined,
          monitors: monitorId ? [{ id: monitorId }] : undefined,
        };

        const Key = `${folderId}/${file.hash}-${getS3Name(file.originalname)}`;
        try {
          const promise = await this.s3Service
            .upload({
              Bucket: this.bucket,
              Key,
              ContentType: file.mimetype,
              Body: createReadStream(file.path),
            })
            .promise();
          if (!promise) {
            throw new Error('Failed to upload');
          }
          this.logger.debug(
            `The file '${file.path}' has been uploaded on S3 '${promise.Key}'`,
          );
        } catch (error) {
          this.logger.error('S3 Error: upload', error);
          throw new ServiceUnavailableException(error);
        }

        return fileRepository.save(
          fileRepository.create<FileEntity>(FileEntity, media),
        );
      });

      return Promise.all(filesPromises);
    });
  }

  /**
   * Head request
   * @param {FileEntity} {FileEntity} file
   * @returns {} {PromiseResult<AWS.S3.HeadObjectOutput, AWS.AWSError>} S3 headers
   */
  async headS3Object(
    file: FileEntity,
  ): Promise<PromiseResult<AWS.S3.HeadObjectOutput, AWS.AWSError>> {
    const Key = `${file.folder.id}/${file.hash}-${getS3Name(file.name)}`;
    return this.s3Service
      .headObject({
        Bucket: this.bucket,
        Key,
      })
      .promise()
      .then((value) => {
        this.logger.debug(
          `The file '${file.id}' head on S3 '${Key}': ${JSON.stringify(value)}`,
        );
        return value;
      });
  }

  /**
   * Get S3 object
   * @param {FileEntity} {FileEntity} file
   * @returns {} {PromiseResult<AWS.S3.GetObjectOutput, AWS.AWSError>} S3 object
   */
  getS3Object(
    file: FileEntity,
  ): AWS.Request<AWS.S3.GetObjectOutput, AWS.AWSError> {
    const Key = `${file.folder.id}/${file.hash}-${getS3Name(file.name)}`;
    return this.s3Service.getObject({
      Bucket: this.bucket,
      Key,
    });
  }

  /**
   * Delete S3 object
   * @param {FileEntity} {FileEntity} file
   * @returns {} {PromiseResult<AWS.S3.DeleteObjectOutput, AWS.AWSError>} S3 object
   */
  async deleteS3Object(
    file: FileEntity,
  ): Promise<PromiseResult<AWS.S3.DeleteObjectOutput, AWS.AWSError>> {
    const Key = `${file.folder.id}/${file.hash}-${getS3Name(file.name)}`;
    return this.s3Service
      .deleteObject({
        Bucket: this.bucket,
        Key,
      })
      .promise()
      .then((value) => {
        this.logger.debug(
          `The file '${Key}' has been deleted on S3: ${
            value.$response.data?.DeleteMarker || true
          }`,
        );
        return value;
      });
  }

  /**
   * Copy S3 object
   * @param {FileEntity} {FileEntity} file
   * @returns {} {PromiseResult<AWS.S3.CopyObjectOutput, AWS.AWSError>} S3 object copied
   */
  async copyS3Object(
    update: FolderEntity,
    file: FileEntity,
  ): Promise<PromiseResult<AWS.S3.CopyObjectOutput, AWS.AWSError>> {
    const s3Name = getS3Name(file.name);
    const Key = `${update.id}/${file.hash}-${s3Name}`;
    const CopySource = `${file.folder.id}/${file.hash}-${s3Name}`;

    return this.s3Service
      .copyObject({
        Bucket: this.bucket,
        CopySource: `/${this.bucket}/${CopySource}`,
        Key,
        MetadataDirective: 'REPLACE',
      })
      .promise()
      .then((fileUpdated) => {
        this.logger.debug(
          `The file has been copied on S3: from ${CopySource} to ${Key}`,
        );
        return fileUpdated;
      });
  }

  async copy(
    userId: string,
    toFolder: FolderEntity,
    originalFiles: FileEntity[],
  ): Promise<FileEntity[]> {
    return this.fileRepository.manager.transaction(async (fileRepository) => {
      const filePromises = originalFiles.map(async (file) => {
        await this.copyS3Object(toFolder, file).catch((error) => {
          this.logger.error(`S3 Error copyObject: ${JSON.stringify(error)}`);
        });

        const fileCopy = fileRepository.create(FileEntity, {
          ...file,
          userId,
          folderId: toFolder.id,
          folder: toFolder,
          id: undefined,
          preview: undefined,
          playlists: undefined,
          monitors: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        });
        return fileRepository.save(FileEntity, fileCopy);
      });

      return Promise.all(filePromises);
    });
  }

  async deletePrep(filesId: string[]): Promise<void> {
    const [videoFiles, audioFiles, playlistFiles] = await Promise.all([
      this.editorService.find({
        where: [
          {
            videoLayers: {
              file: { id: In(filesId) },
            },
          },
        ],
        select: {
          id: true,
          name: true,
          videoLayers: {
            id: true,
            file: {
              id: true,
              name: true,
            },
          },
        },
        relations: {
          videoLayers: {
            file: true,
          },
        },
        loadEagerRelations: false,
      }),
      this.editorService.find({
        where: [
          {
            audioLayers: {
              file: { id: In(filesId) },
            },
          },
        ],
        select: {
          id: true,
          name: true,
          audioLayers: {
            id: true,
            file: {
              id: true,
              name: true,
            },
          },
        },
        relations: {
          audioLayers: {
            file: true,
          },
        },
        loadEagerRelations: false,
      }),
      this.playlistService.find({
        where: { files: { id: In(filesId) } },
        select: {
          id: true,
          name: true,
          files: {
            id: true,
            name: true,
          },
        },
        relations: {
          files: true,
        },
        loadEagerRelations: false,
      }),
    ]);

    if (
      (Array.isArray(videoFiles) && videoFiles.length > 0) ||
      (Array.isArray(audioFiles) && audioFiles.length > 0) ||
      (Array.isArray(playlistFiles) && playlistFiles.length > 0)
    ) {
      const errorMsg = {} as ConflictData;
      if (Array.isArray(videoFiles) && videoFiles.length > 0) {
        errorMsg.video = videoFiles.map((editor) => ({
          id: editor.id,
          name: editor.name,
          file: editor.videoLayers.map((layer) => layer.file)?.pop(),
        }));
      }
      if (Array.isArray(audioFiles) && audioFiles.length > 0) {
        errorMsg.audio = audioFiles.map((editor) => ({
          id: editor.id,
          name: editor.name,
          file: editor.audioLayers.map((layer) => layer.file)?.pop(),
        }));
      }
      if (Array.isArray(playlistFiles) && playlistFiles.length > 0) {
        errorMsg.playlist = playlistFiles.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          file: playlist.files?.find((file) => filesId.includes(file.id)),
        }));
      }
      throw new ConflictException(
        errorMsg,
        'Файл, который Вы пытаетесь удалить используется в редакторе или в плэйлисте',
      );
    }
  }

  /**
   * Delete files
   * @async
   * @param {string} userId User ID
   * @param {string} filesId Files ID
   * @return {DeleteResult} {DeleteResult}
   */
  async delete(userId: string, filesId: string[]): Promise<DeleteResult> {
    const files = await this.fileRepository.find({
      where: { userId, id: In(filesId) },
    });

    /* await */ Promise.allSettled(
      files.map(async (file) => {
        this.headS3Object(file)
          .then(() => {
            this.deleteS3Object(file).catch((error) => {
              this.logger.error(
                `S3 Error deleteObject: ${JSON.stringify(error)}`,
              );
            });
          })
          .catch((error) => {
            this.logger.error(`S3 Error headObject: ${JSON.stringify(error)}`);
          });
      }),
    );

    return this.fileRepository.delete({
      id: In(files.map((file) => file.id)),
      userId,
    });
  }

  async previewFile(file: FileEntity): Promise<Buffer> {
    await fs.mkdir(this.downloadDir, { recursive: true });
    const filename = pathJoin(this.downloadDir, file.name);
    let outPath = pathJoin(
      this.downloadDir,
      `${pathParse(file.name).name}-preview`,
    );
    outPath += file.videoType === VideoType.Video ? '.webm' : '.jpg';

    if (await fs.access(outPath).catch(() => true)) {
      const filenameStream = createWriteStream(filename);
      await this.getS3Object(file)
        .on('httpHeaders', (statusCode, headers, awsResponse) => {
          if (statusCode === 200) {
            (
              awsResponse.httpResponse.createUnbufferedStream() as Readable
            ).pipe(filenameStream);
          } else {
            throw new HttpException(
              awsResponse.error || awsResponse.httpResponse.statusMessage,
              awsResponse.httpResponse.statusCode,
            );
          }
        })
        .promise()
        .then(() => {
          this.logger.debug(`The file ${file.name} has been downloaded`);
        });
    }

    await FfMpegPreview(file.videoType, file.meta, filename, outPath).catch(
      (reason: unknown) => {
        throw new InternalServerErrorException(reason);
      },
    );

    const preview = await fs.readFile(outPath);

    await this.filePreviewRepository
      .save(
        this.filePreviewRepository.create({
          ...file.preview,
          file,
          preview,
        }),
      )
      .catch(() => {});

    return preview;
  }

  async preview(
    type: VideoType,
    file: Express.Multer.File,
    meta: MediaMeta,
  ): Promise<Buffer> {
    let preview: Buffer;
    if (type === VideoType.Image) {
      const outPath = pathJoin(
        `${file.destination}/${pathParse(file.filename).name}-preview.jpg`,
      );
      await FfMpegPreview(type, meta, file.path, outPath).catch((reason) => {
        throw new InternalServerErrorException(reason);
      });

      preview = await fs.readFile(outPath);
    } else if (type === VideoType.Video) {
      const outPath = pathJoin(
        `${file.destination}/${pathParse(file.filename).name}-preview.webm`,
      );
      await FfMpegPreview(type, meta, file.path, outPath).catch((reason) => {
        throw new InternalServerErrorException(reason);
      });

      preview = await fs.readFile(outPath);
    } else {
      preview = Buffer.alloc(0);
    }

    return preview;
  }

  /**
   * Meta information
   * @param {Express.Multer.File} file Express File
   * @return {[MediaMeta, VideoType, string, Buffer]} [MediaMeta, VideoType, string, Buffer]
   */
  private async metaInformation(
    file: Express.Multer.File,
  ): Promise<[MediaMeta, VideoType, string, Buffer]> {
    const [mime] = file.mimetype.split('/');
    const extension = pathParse(file.originalname).ext.slice(1);
    const type =
      Object.values(VideoType).find((t) => t === mime) ?? VideoType.Other;

    if (file.media) {
      const {
        media: { format: mediaFormat, streams },
      } = file;
      const { filename, ...format } = mediaFormat ?? {};
      const meta: MediaMeta = {
        filesize: Number(file.media.format?.size) || file.size,
        duration: parseFloat(
          `${
            file.media.format?.duration ??
            file.media.streams?.[0]?.duration ??
            0
          }`,
        ),
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

      return [meta, type, extension, Buffer.alloc(0)];
    }

    return [{ filesize: file.size }, type, extension, Buffer.alloc(0)];
  }
}
